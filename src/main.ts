import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  EvenAppBridge,
  OsEventTypeList,
} from "@evenrealities/even_hub_sdk";
import init, { detect_pitch } from "../wasm-tuner-pkg/wasm_tuner.js";
import { AudioBuffer } from "./audio-buffer";
import { renderTunerDisplay } from "./tuner-ui";

const SAMPLE_RATE = 16000;
const CONTAINER_ID = 1;

async function main() {
  await init();
  const bridge: EvenAppBridge = await waitForEvenAppBridge();

  const textContainer = new TextContainerProperty();
  textContainer.containerID = CONTAINER_ID;
  textContainer.containerName = "tuner";
  textContainer.xPosition = 0;
  textContainer.yPosition = 0;
  textContainer.width = 576;
  textContainer.height = 288;
  textContainer.isEventCapture = 1;
  textContainer.content = "Listening...";

  const startPage = new CreateStartUpPageContainer();
  startPage.containerTotalNum = 1;
  startPage.textObject = [textContainer];

  await bridge.createStartUpPageContainer(startPage);

  const audioBuffer = new AudioBuffer();

  function updateDisplay(text: string) {
    const upgrade = new TextContainerUpgrade();
    upgrade.containerID = CONTAINER_ID;
    upgrade.containerName = "tuner";
    upgrade.content = text;
    upgrade.contentOffset = 0;
    upgrade.contentLength = text.length;
    bridge.textContainerUpgrade(upgrade);
  }

  bridge.onEvenHubEvent((event) => {
    if (event.audioEvent?.audioPcm) {
      const pcm = event.audioEvent.audioPcm;
      const full = audioBuffer.push(pcm);

      if (full) {
        const result = detect_pitch(full, SAMPLE_RATE);
        const display = renderTunerDisplay(result.frequency, result.confidence);
        updateDisplay(display);
      }
    }

    if (event.sysEvent?.eventType === OsEventTypeList.FOREGROUND_EXIT_EVENT) {
      bridge.audioControl(false);
    }

    if (event.sysEvent?.eventType === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
      bridge.audioControl(true);
    }
  });

  await bridge.audioControl(true);
}

main();
