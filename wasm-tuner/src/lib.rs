use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct PitchResult {
    frequency: f32,
    confidence: f32,
}

#[wasm_bindgen]
impl PitchResult {
    #[wasm_bindgen(getter)]
    pub fn frequency(&self) -> f32 {
        self.frequency
    }

    #[wasm_bindgen(getter)]
    pub fn confidence(&self) -> f32 {
        self.confidence
    }
}

fn pcm_i16_to_f32(pcm_bytes: &[u8]) -> Vec<f32> {
    pcm_bytes
        .chunks_exact(2)
        .map(|chunk| {
            let sample = i16::from_le_bytes([chunk[0], chunk[1]]);
            sample as f32 / 32768.0
        })
        .collect()
}

fn rms(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum_sq: f32 = samples.iter().map(|&s| s * s).sum();
    (sum_sq / samples.len() as f32).sqrt()
}

fn yin_detect(samples: &[f32], sample_rate: u32) -> PitchResult {
    let len = samples.len();
    if len < 2 {
        return PitchResult {
            frequency: 0.0,
            confidence: 0.0,
        };
    }

    // Ignore quiet signals (RMS threshold ~= -54 dB)
    if rms(samples) < 0.002 {
        return PitchResult {
            frequency: 0.0,
            confidence: 0.0,
        };
    }

    let tau_max = len / 2;
    let mut diff = vec![0.0f32; tau_max];

    for tau in 1..tau_max {
        for i in 0..tau_max {
            let delta = samples[i] - samples[i + tau];
            diff[tau] += delta * delta;
        }
    }

    // Cumulative mean normalized difference
    let mut cmnd = vec![0.0f32; tau_max];
    cmnd[0] = 1.0;
    let mut running_sum = 0.0f32;

    for tau in 1..tau_max {
        running_sum += diff[tau];
        if running_sum > 0.0 {
            cmnd[tau] = diff[tau] * tau as f32 / running_sum;
        } else {
            cmnd[tau] = 1.0;
        }
    }

    // Absolute threshold: find first dip below 0.1
    let threshold = 0.1;
    let mut tau_estimate = 0usize;

    // Skip very low tau values (frequencies above ~4kHz are not guitar)
    let tau_min = (sample_rate as f32 / 4000.0) as usize;
    let start = if tau_min > 1 { tau_min } else { 2 };

    for tau in start..tau_max {
        if cmnd[tau] < threshold {
            tau_estimate = tau;
            while tau_estimate + 1 < tau_max && cmnd[tau_estimate + 1] < cmnd[tau_estimate] {
                tau_estimate += 1;
            }
            break;
        }
    }

    if tau_estimate == 0 {
        // Fallback: find global minimum
        let mut min_val = f32::MAX;
        for tau in start..tau_max {
            if cmnd[tau] < min_val {
                min_val = cmnd[tau];
                tau_estimate = tau;
            }
        }
        if min_val > 0.5 {
            return PitchResult {
                frequency: 0.0,
                confidence: 0.0,
            };
        }
    }

    // Parabolic interpolation for sub-sample accuracy
    let tau_f = if tau_estimate > 0 && tau_estimate < tau_max - 1 {
        let s0 = cmnd[tau_estimate - 1];
        let s1 = cmnd[tau_estimate];
        let s2 = cmnd[tau_estimate + 1];
        let denom = 2.0 * s1 - s2 - s0;
        if denom.abs() > 1e-10 {
            tau_estimate as f32 + (s2 - s0) / (2.0 * denom)
        } else {
            tau_estimate as f32
        }
    } else {
        tau_estimate as f32
    };

    let frequency = if tau_f > 0.0 {
        sample_rate as f32 / tau_f
    } else {
        0.0
    };

    let confidence = if tau_estimate < tau_max {
        1.0 - cmnd[tau_estimate]
    } else {
        0.0
    };

    PitchResult {
        frequency,
        confidence: confidence.clamp(0.0, 1.0),
    }
}

#[wasm_bindgen]
pub fn detect_pitch(pcm_bytes: &[u8], sample_rate: u32) -> PitchResult {
    let samples = pcm_i16_to_f32(pcm_bytes);
    yin_detect(&samples, sample_rate)
}
