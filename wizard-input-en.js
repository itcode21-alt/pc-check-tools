(() => {
  // English edition of the input, sound and peripherals self-check (wizard-input.js). Behavior lives in
  // symptom-wizard.js, screen text in wizard-ui-en.js. A faithful translation of the Korean wizard: no new claims.
  // Windows menu names are the English Windows 11 names. Links to Korean-only guides and tools are left out; the one
  // step that opened the Korean device test page asks the reader to type in a text editor instead.
  const LIMIT = (text) => ({ limit: true, t: text });

  const S = {
    port: {
      t: "Plug it straight into another USB port",
      tools: ["A different USB cable (if you have one)"],
      how: [
        "If you are using a USB hub or an extension cable, remove it and connect the device directly to the PC. A hub can be a cause of a device not being detected, because it may supply too little or unstable power.",
        "On a desktop, plug it into a USB port wired directly to the motherboard on the back of the PC (near the LAN port and audio jacks). If a front port does not work, testing a back port tells you whether the problem is the front panel connection.",
        "On a laptop, try the other USB ports on the left and right sides.",
        "For a wireless device, plug the USB receiver into another port. Plugging it next to a 3.0 (blue) port can cause interference, so also try a 2.0 port.",
        "If you have another USB cable, swap it in.",
        "Each time you swap, check whether the device works.",
      ],
    },
    otherPc: {
      t: "Check whether it behaves the same on another PC",
      tools: ["Another PC or laptop"],
      spare: "If you have another device that you know works (a used or spare one is fine), plugging it into this PC for comparison tells you whether the problem is the device or the PC.",
      how: [
        "Connect the same device to another PC or laptop. For a device with a cable, use the same cable.",
        "Use the device for a few minutes to see whether it works.",
        "If it fails on the other PC too, the device itself is the likely cause.",
        "If it works on the other PC, the likely cause is the port, driver or settings of your current PC.",
        "Note on which PC it worked and on which it did not.",
      ],
    },
    deviceMgr: {
      t: "Find the device in Device Manager and have Windows reinstall it",
      tools: [],
      how: [
        "Right-click the Start button and open \"Device Manager\". If the keyboard does not work, press the Windows key and search, or right-click the Start button with the mouse.",
        "Expand the entry for the device (Keyboards, Mice and other pointing devices, Sound, Cameras, Bluetooth and so on).",
        "Look for a yellow exclamation mark or an \"Unknown device\". Also watch whether the list changes when you unplug and re-plug the device.",
        "Right-click the device, choose \"Uninstall device\" and restart. In most cases it is installed again automatically.",
        "If it is not installed automatically, download the driver for your model from the PC or laptop maker's support page and install it.",
      ],
    },
    fullRestart: {
      t: "Do a full restart to make Windows detect the device again",
      tools: [],
      how: [
        "Save any open work.",
        "Choose Start button → Power → \"Restart\". \"Shut down\" can keep the device state because of Fast Startup, so Restart is more reliable.",
        "When the restart finishes, unplug the device and plug it in again.",
        "Check whether the device works.",
        "If the keyboard does not work and you need to type, you can turn on the on-screen keyboard with Windows key + Ctrl + O.",
      ],
    },
    soundOutput: {
      t: "Check the sound output device and mute",
      tools: [],
      how: [
        "Right-click the speaker icon at the right of the taskbar and open \"Sound settings\". If the icon has an X mark, the sound is muted.",
        "In \"Output\", check that the device you are using (speakers, headphones, a monitor name and so on) is selected. Also check that the volume is not 0 and not muted.",
        "If you connected a monitor by HDMI or DisplayPort, the output may be set to the monitor, so switch it in the list to your real speakers or earphones.",
        "In the \"Volume mixer\" lower down (or \"App volume and device preferences\"), also check that the app in question is not muted or at 0.",
        "Check whether sound comes out.",
      ],
    },
    privacy: (what, path) => ({
      t: `Check ${what} access permission`,
      tools: [],
      how: [
        `Open Settings (Win+I) > Privacy & security > "${path}".`,
        `Check that "${path} access" is on. If it is off, turn it on.`,
        `Also check that "Let apps access your ${what}" is on.`,
        `In the app list below, check that the app you want to use (video meetings, messengers and so on) is set to allowed. If you use it in a browser, the browser must also be allowed in the list.`,
        "After you change the permission, quit the app completely and run it again to check. In a browser, also check the per-site permission from the padlock icon at the left of the address bar.",
      ],
    }),
  };

  const NODES = {
    start: {
      q: "Which device has the problem?",
      hint: "Pick the one symptom that is closest.",
      options: [
        { t: "A keyboard or mouse is not detected or does not respond", icon: "keyboard", next: "r_kbm" },
        { t: "Only certain keys on the keyboard do not press", icon: "key", next: "r_keys" },
        { t: "The laptop touchpad does not work", icon: "touchpad", next: "r_touchpad" },
        { t: "There is no sound at all", icon: "speaker", next: "r_sound" },
        { t: "Sound comes from only one side of the earphones", icon: "headphones", next: "r_earphone" },
        { t: "The microphone is not picked up, or the other person can't hear me", icon: "mic", next: "r_mic" },
        { t: "The webcam (camera) shows nothing", icon: "camera", next: "r_cam" },
        { t: "A Bluetooth device cannot be found", icon: "bluetooth", next: "r_bt" },
        { t: "A USB device is not detected", icon: "usb", next: "r_usb" },
      ],
    },
    r_kbm: {
      mode: "remote",
      title: "For a keyboard or mouse, sort it out in the order of port, receiver, another PC",
      lead: "When an input device is not detected, check the port and cable, the wireless receiver and battery, and the driver, in that order.",
      steps: [
        S.port,
        {
          t: "Check the wireless device's battery and receiver",
          tools: ["New batteries (for the wireless device, if you have them)"],
          how: [
            "Replace the batteries of the wireless keyboard or mouse with new ones, or charge it. When the battery is nearly empty, input cuts out or responds slowly.",
            "Check that the USB receiver is plugged in. Try plugging it into another USB port.",
            "Turn the power switch on the underside of the device off and on again.",
            "Pair the receiver again by the method in the product manual. Usually you press the Connect button on the underside of the device with the receiver plugged in, or switch the power on and wait a while.",
            "Check whether it works.",
          ],
        },
        S.fullRestart,
        S.deviceMgr,
        S.otherPc,
        LIMIT("If both the device and the port are fine and it still fails, the problem may be on the motherboard's USB side, so it is safer to hand it over."),
      ],
    },
    r_keys: {
      mode: "remote",
      title: "If only certain keys fail, separate debris, settings and the keyboard itself",
      lead: "Keys that do not press are commonly caused by debris or poor contact, an accessibility (Filter keys) setting, or a fault in the keyboard itself.",
      steps: [
        {
          t: "Find out which keys fail with a key input test",
          tools: [],
          how: [
            "Open a text editor such as Notepad and click inside it.",
            "Press the keys one at a time and check whether each one types or responds on the screen.",
            "Remember whether one or two keys fail, or a whole row or a particular area.",
            "If only one or two keys fail, debris under the key or a faulty switch is possible. If a whole area fails, a fault in the keyboard circuit or its connection becomes more likely.",
            "Note the position of the keys that fail when you ask for help.",
          ],
        },
        {
          t: "Turn off Filter keys and Sticky keys",
          tools: [],
          how: [
            "Open Settings (Win+I) > Accessibility > Keyboard.",
            "Find \"Sticky keys\", \"Filter keys\" and \"Toggle keys\". If any is on, turn it off.",
            "Also turn off the \"Keyboard shortcut\" option of each. In some cases the cause was the feature that opens the Sticky keys window when you press Shift five times in a row.",
            "Type in Notepad or similar to see whether input returns to normal.",
          ],
        },
        {
          t: "Clean debris around the keys",
          tools: ["Compressed air or a soft brush", "A keycap puller (for mechanical or removable-key keyboards, optional)"],
          how: [
            "Disconnect the keyboard from the PC (switch off a wireless one), turn it upside down and shake it gently to get the crumbs out.",
            "Clean between the keys with compressed air or a soft brush. Spray the air in short bursts.",
            "On a keyboard with removable keys, you can pull off only the keycap of the key that does not press, using a keycap puller, and clean under it. Pull the keycap straight up.",
            "Do not force keys off a laptop keyboard or a model where they are hard to remove. The clips under the keycap can break.",
            "After cleaning, check whether key input returns to normal.",
            "If you have ever spilled liquid on it, cleaning may not fix it, so ask for help.",
          ],
        },
        S.otherPc,
        LIMIT("A laptop keyboard needs to be taken apart, so it is hard to repair yourself. It is safer to hand it over."),
      ],
    },
    r_touchpad: {
      mode: "remote",
      title: "For a touchpad, check the off key, the settings and the driver in that order",
      lead: "When a laptop touchpad does not work, it is often switched off by a shortcut, switched off in the settings, or a driver problem.",
      steps: [
        {
          t: "Check the touchpad on/off shortcut",
          tools: [],
          how: [
            "On the top row of function keys (F1 to F12), find the key with a touchpad picture (a finger inside a rectangle).",
            "Hold the Fn key and press that key to see whether the touchpad turns on. The key differs by model.",
            "On some laptops, double-tapping the top left corner of the touchpad turns it on and off. Models with a small dot in the corner apply.",
            "Move a finger on the touchpad to see whether the cursor moves.",
          ],
        },
        {
          t: "Turn the touchpad on in the Windows settings",
          tools: ["An external mouse (to change the settings when the touchpad doesn't work)"],
          how: [
            "If the touchpad does not work, connect an external mouse, or press the Windows key on the keyboard and search for \"touchpad\".",
            "Open Settings (Win+I) > Bluetooth & devices > Touchpad.",
            "Check that the \"Touchpad\" switch is on. If it is off, turn it on.",
            "If there is an option \"Leave touchpad on when a mouse is connected\", leave it on so you can use the touchpad whether or not a mouse is connected.",
            "Check whether the cursor moves on the touchpad.",
          ],
        },
        S.deviceMgr,
        {
          t: "Install the manufacturer's touchpad driver",
          tools: [],
          how: [
            "On the laptop maker's support page (Samsung, LG, Lenovo, HP, ASUS and so on), search for your model name. The model name is on the sticker on the underside of the laptop.",
            "In the driver list, find the touchpad driver (Pointing Device, Touchpad).",
            "If the touchpad does not work, download it on this PC with an external mouse, or download it on another device and move it over by USB.",
            "Run the downloaded file to install it.",
            "After installing, restart and check that it works.",
          ],
        },
        LIMIT("If it still does not work, the touchpad hardware needs to be checked, so it is safer to hand it over."),
      ],
    },
    r_sound: {
      mode: "remote",
      title: "If there is no sound, check the output device, the driver and the connection in order",
      lead: "Common causes of no sound are the output set to the wrong place, mute, the sound driver, and the jack connection.",
      steps: [
        S.soundOutput,
        {
          t: "Check the sound driver and have Windows reinstall it",
          tools: [],
          how: [
            "Right-click the Start button and open \"Device Manager\".",
            "Expand \"Sound, video and game controllers\".",
            "Check whether the audio device (Realtek Audio and so on) has an exclamation mark or is disabled (a down arrow mark). If it is disabled, right-click it and choose \"Enable device\".",
            "If it looks normal but there is no sound, right-click it, choose \"Uninstall device\" and restart. The driver is installed again automatically at restart.",
            "If it still fails after the restart, download the audio driver from the PC or motherboard maker's site and install it.",
          ],
        },
        {
          t: "Test with another jack or another device",
          tools: ["Other earphones or speakers (if you have them)"],
          spare: "If you have other earphones or speakers that you know work (a used pair is fine), plugging them in to compare is recommended.",
          how: [
            "Plug the earphones or speakers into the audio jack on the back of the PC (desktop). If the front jack does not work, testing the back jack tells you whether it is a connection problem.",
            "If you have other earphones or speakers, swap them in.",
            "Check that the speaker's power is on and that its volume knob is turned up.",
            "Check that the jack the cable is plugged into has the right color (usually green = output). If you plugged it into the microphone jack (pink), there will be no sound.",
            "Each time you swap, check whether sound comes out.",
          ],
        },
        {
          t: "Run the sound troubleshooter and lower the audio format",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Sound. Click \"Troubleshoot common sound problems\" at the top or bottom (or System > Troubleshoot > Other troubleshooters > Playing Audio > \"Run\").",
            "Follow what the troubleshooter says and apply the problems it finds.",
            "If the sound crackles or cuts out, click the output device in Sound settings to open its properties.",
            "Lower the \"Format\" (sample rate and bit depth) to a standard value such as 16 bit, 44100 Hz and test.",
            "If there is an \"Audio enhancements\" option, turn it off and check again.",
          ],
        },
        LIMIT("If it still does not work, the sound hardware or the motherboard audio needs to be checked, so it is safer to hand it over."),
      ],
    },
    r_earphone: {
      mode: "remote",
      title: "If only one side plays, separate mono audio, balance and the earphones themselves",
      lead: "Sound from only one side is often poor contact in the earphones or the jack, but it can also be caused by Windows' mono audio or left-right balance settings.",
      steps: [
        {
          t: "Compare with other earphones and another device",
          tools: ["Other earphones (if you have them)", "Another device such as a phone"],
          spare: "If you have other earphones that you know work (a used pair is fine), plugging them in to compare tells you whether the problem is the earphones or the PC.",
          how: [
            "Plug the problem earphones into another device such as a phone and see whether both sides play.",
            "Plug other earphones into this PC and see whether both sides play.",
            "If the problem follows the earphones, they are faulty; if it appears only on the PC, suspect the jack or the settings.",
            "Also see whether the sound changes when you turn or move the earphone plug slightly. If it does, it is a poor contact.",
            "Note the result.",
          ],
        },
        {
          t: "Check the mono audio and left-right balance settings",
          tools: [],
          how: [
            "Open Settings (Win+I) > Accessibility > Audio.",
            "If \"Mono audio\" is on, turn it off and check the sound again.",
            "In Settings > System > Sound, click the output device and go into \"Properties\". Check that the balance (left and right volume) slider is not pushed to one side.",
            "For Bluetooth earphones, check the balance setting in the maker's app.",
            "Check that both sides play equally.",
          ],
        },
        {
          t: "Check the audio jack for debris and contact",
          tools: ["A soft tool such as a toothpick (for removing dust)"],
          how: [
            "Push the earphone plug in all the way and check whether sound comes out. Also see whether the sound changes when you turn or move it slightly.",
            "Shine a phone flashlight into the jack to see whether there is dust inside.",
            "If there is dust, carefully remove it with a soft tool such as a toothpick. Do not use a metal tool.",
            "Plug into another jack (such as the back jack) and check whether it is the same.",
            "If the contact is unstable, the jack itself may be worn.",
          ],
        },
      ],
    },
    r_mic: {
      mode: "remote",
      title: "For a microphone, check the access permission, the input device and the connection in order",
      lead: "Common causes of a microphone not being picked up are Windows' microphone access being off, the wrong input device being selected, or a jack connection problem.",
      steps: [
        S.privacy("microphone", "Microphone"),
        {
          t: "Check the input device selection and the input volume",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Sound.",
            "In \"Input\", check that the microphone you want to use is selected. If the wrong device is selected, choose the microphone you want to use.",
            "Speak into the microphone and see whether the \"Input volume\" bar moves. If it does not move, the microphone is not receiving sound.",
            "Also check that the input volume slider is not at 0 and not muted.",
            "In the settings of apps such as video meetings and games, also check that the right microphone device is selected.",
          ],
        },
        {
          t: "Check the microphone jack and connection, and test with another microphone",
          tools: ["Another microphone or earphones with a microphone (if you have them)"],
          spare: "If you have another microphone that you know works (a used one is fine), plugging it in to compare is recommended.",
          how: [
            "Plug the microphone into the microphone jack on the back of the PC (usually pink). If the front jack does not work, testing the back jack tells you whether it is a connection problem.",
            "Check whether your headset has a single plug (4-pole) or two separate plugs for microphone and earphones, and plug it into the matching jack.",
            "If it is a USB microphone, plug it into another USB port.",
            "If you have another microphone or earphones with a microphone, swap them in.",
            "See whether the \"Input volume\" bar in Sound settings moves.",
          ],
        },
        S.deviceMgr,
      ],
    },
    r_cam: {
      mode: "remote",
      title: "For a webcam, check the access permission, other apps using it and detection in order",
      lead: "Common causes of a webcam showing nothing are the camera access being off, another app using the camera, or the device not being detected.",
      steps: [
        S.privacy("camera", "Camera"),
        {
          t: "Check whether another app is using the camera, and check the physical shutter",
          tools: [],
          how: [
            "Close every video meeting, camera app and browser tab that may be using the camera. In many cases two programs cannot use the camera at the same time.",
            "In Task Manager (Ctrl+Shift+Esc), under \"Processes\", also check whether an app that uses the camera is still running.",
            "On a laptop, check that the physical shutter (a sliding cover) over the camera lens, or the camera off key on the keyboard (an Fn combination), is not closed.",
            "For an external webcam, check that the cable is properly plugged into the port and whether it works on another USB port.",
            "Open the Camera app and check whether video appears.",
          ],
        },
        S.port,
        S.deviceMgr,
      ],
    },
    r_bt: {
      mode: "remote",
      title: "For Bluetooth, check that it is on, the pairing and adapter detection in order",
      lead: "When a Bluetooth device cannot be found, check whether the PC's Bluetooth is on, whether the device is in pairing mode and whether the adapter is detected. Some desktops have no built-in Bluetooth.",
      steps: [
        {
          t: "Check that Bluetooth is on and the device is in pairing mode",
          tools: [],
          how: [
            "In Settings (Win+I) > Bluetooth & devices, check that the Bluetooth switch is on. On a laptop, also check that it is not switched off by Airplane mode or an Fn key.",
            "Put the device you want to connect (earphones, a mouse and so on) into pairing mode. The usual way is to hold the power button or press a dedicated pairing button until the light blinks; check the product manual.",
            "Click \"Add device\", choose \"Bluetooth\" and search for the device.",
            "When the device name appears in the list, select it to connect.",
            "If the device was connected to another device before, switch Bluetooth off on that device.",
          ],
        },
        {
          t: "Remove the device that is already registered and add it again",
          tools: [],
          how: [
            "In Settings > Bluetooth & devices, look at the list of connected devices.",
            "Click the three dots at the right of the device and choose \"Remove device\".",
            "Put the device into pairing mode again.",
            "Click \"Add device\" → \"Bluetooth\" and add it as new.",
            "If it was connected to another device (such as a phone) before, switch Bluetooth off on that device or delete its registration there.",
          ],
        },
        {
          t: "Check that a Bluetooth adapter is detected",
          tools: ["A USB Bluetooth adapter (for a desktop with no built-in Bluetooth, optional)"],
          how: [
            "Right-click the Start button and open \"Device Manager\".",
            "Check whether there is a \"Bluetooth\" entry. If there is not, there is no built-in Bluetooth, or it is not being detected.",
            "If a desktop has no built-in Bluetooth, you can plug in a USB Bluetooth adapter and use that.",
            "If the entry has an exclamation mark, right-click it, choose \"Uninstall device\" and restart.",
            "After the restart, check that the Bluetooth entry appears normally.",
          ],
        },
        {
          t: "Check the distance and interference",
          tools: [],
          how: [
            "Keep the device within 1 m of the PC. Bluetooth drops out at a long distance.",
            "Interference is possible if it is near a router, a microwave oven or other wireless devices, so move it away.",
            "If you plugged a Bluetooth or wireless receiver in next to a USB 3.0 port, interference is possible, so try plugging it in farther away using an extension cable.",
            "Check that it is not somewhere the signal is blocked, such as behind the PC case or under a metal desk.",
            "After changing the position, check whether the dropouts have decreased.",
          ],
        },
      ],
    },
    r_usb: {
      mode: "remote",
      title: "For a USB device, check the port, the hub, the power saving setting and the driver in order",
      lead: "When a USB device is not detected, check the port and hub, the USB power saving setting and the driver, in that order. If a front port does not work, test a back port first.",
      steps: [
        S.port,
        S.deviceMgr,
        {
          t: "Turn off USB selective suspend",
          tools: [],
          how: [
            "Type \"Control Panel\" in the Start menu search and open it. Open \"Hardware and Sound\" > \"Power Options\".",
            "Next to the power plan you are using, click \"Change plan settings\" and open \"Change advanced power settings\".",
            "In the list, expand \"USB settings\" > \"USB selective suspend setting\".",
            "Change both \"On battery\" and \"Plugged in\" to \"Disabled\" and click OK.",
            "After restarting, watch for a few days to see whether the device still drops out.",
          ],
        },
        S.fullRestart,
        S.otherPc,
        LIMIT("If you suspect a problem with the motherboard's USB port itself, it is safer to hand it over. If only the front port fails, using a back port is also an option."),
      ],
    },
  };

  window.ITSVC_WIZARD = { nodes: NODES };

  // Per-step notes (c: cause candidate, m: rough time, l: difficulty, w: why, r: how to read the result). The time is a
  // rough estimate based on the kind of task, not a measurement. Site tools that exist only in Korean are not linked.
  window.ITSVC_WIZARD_META = Object.assign(window.ITSVC_WIZARD_META || {}, {
    "Plug it straight into another USB port": { c: "USB port or cable problem", m: "About 3 min", l: "Easy", w: "It is the easiest way to tell whether the port or cable is the problem or the device is. Remove the hub and plug in directly.", r: "If it works on another port → the original port or hub was the problem." },
    "Check the wireless device's battery and receiver": { c: "Battery or receiver problem", m: "About 5 min", l: "Easy", w: "The most common reasons a wireless keyboard or mouse fails are the battery and the receiver. Check with new batteries and another port.", r: "If it works after changing the battery or the port → that was the cause." },
    "Do a full restart to make Windows detect the device again": { c: "Tangled device detection state (temporary error)", m: "About 5 min", l: "Easy", w: "\"Restart\" resets the device state more reliably than \"Shut down\". A temporary detection error sometimes clears.", r: "If the device is detected after the restart → it was a temporary detection error." },
    "Find the device in Device Manager and have Windows reinstall it": { c: "Device driver problem", m: "About 10 min", l: "Easy", w: "If Windows has detected the device wrongly, removing it and letting Windows detect it again is effective.", r: "If it works after reinstalling → it was a driver problem." },
    "Check whether it behaves the same on another PC": { c: "The device itself has failed", m: "About 10 min", l: "Easy", w: "Plugging the same device into another PC tells you right away whether the device is faulty or the problem is this PC.", r: "If it fails on the other PC too → the device is faulty." },
    "Find out which keys fail with a key input test": { c: null, m: "About 5 min", l: "Easy", w: "You need to know exactly which keys fail to narrow down the cause. The cause differs depending on whether it is one key or a whole row.", r: "If a whole area fails → a circuit or connection problem is more likely." },
    "Turn off Filter keys and Sticky keys": { c: "Accessibility key settings", m: "About 5 min", l: "Easy", w: "With accessibility features on, keys can feel as if they do not press. It may be a setting, not a fault.", r: "If it is normal after turning them off → the accessibility setting was the cause." },
    "Clean debris around the keys": { c: "Debris or poor contact", m: "About 15 min", l: "Moderate", w: "Crumbs or dust between the keys often block them. Cleaning sometimes brings them back.", r: "If the key presses after cleaning → debris was the cause." },
    "Check the touchpad on/off shortcut": { c: "Touchpad switched off (shortcut)", m: "About 3 min", l: "Easy", w: "A laptop can switch the touchpad off with an Fn key combination. Pressing it by accident is the most likely cause.", r: "If the shortcut turns it on → it had been switched off." },
    "Turn the touchpad on in the Windows settings": { c: "Touchpad turned off in settings", m: "About 5 min", l: "Easy", w: "The touchpad may be off in the Windows settings, or an option that turns it off automatically when a mouse is plugged in may be on.", r: "If it works after turning it on in settings → it was a settings problem." },
    "Install the manufacturer's touchpad driver": { c: "Touchpad driver problem", m: "About 20 min", l: "Moderate", w: "The touchpad will not work if the maker's driver that runs it is missing or tangled. Reinstall the driver that matches your model.", r: "If it works after installing → it was a driver problem." },
    "Check the sound output device and mute": { c: "Output device selection or mute", m: "About 5 min", l: "Easy", w: "The most common reason for no sound is that the sound goes to the wrong device, or it is muted. Check the settings first.", r: "If you hear it after changing the output device → it was an output selection problem." },
    "Check the sound driver and have Windows reinstall it": { c: "Sound driver problem", m: "About 15 min", l: "Moderate", w: "If the sound driver is off or tangled, there is no sound at all. Turn the device on, or remove it and let Windows detect it again.", r: "If sound comes out after reinstalling → it was a driver problem." },
    "Test with another jack or another device": { c: "Jack or device problem", m: "About 10 min", l: "Easy", w: "This tells whether the problem is the jack or the earphones or speakers. Swapping to a back jack or another device makes it certain.", r: "If sound comes out on another jack or device → the original jack or device is the problem." },
    "Run the sound troubleshooter and lower the audio format": { c: "Audio format or enhancement settings", m: "About 10 min", l: "Easy", w: "When the sound crackles or cuts out, the format setting is sometimes too high. Lowering it can make it stable.", r: "If it improves after lowering to a standard value → the format setting is the cause." },
    "Compare with other earphones and another device": { c: "The earphones themselves have failed", m: "About 5 min", l: "Easy", w: "This tells whether the earphones themselves are faulty or the problem is on the PC side. Plugging them into another device shows it right away.", r: "If only one side plays on another device too → the earphones are faulty." },
    "Check the mono audio and left-right balance settings": { c: "Mono audio or left-right balance setting", m: "About 5 min", l: "Easy", w: "If Windows' mono audio or left-right balance is pushed to one side, it can sound as if only one side plays.", r: "If both sides play after correcting the setting → it was a settings problem." },
    "Check the audio jack for debris and contact": { c: "Debris in the jack or poor contact", m: "About 10 min", l: "Easy", w: "Dust in the jack, or a plug not pushed in fully, drops one side of the sound. Push it in all the way and move it slightly to check.", r: "If the sound changes when you move it → it is a poor contact." },
    "Check microphone access permission": { c: "Microphone access permission", m: "About 5 min", l: "Easy", w: "Windows can block apps from using the microphone for privacy. It must be allowed for sound to get in.", r: "If it works after allowing it → it was a permission problem." },
    "Check the input device selection and the input volume": { c: "Input device selection or volume", m: "About 5 min", l: "Easy", w: "With several microphones, the wrong one may be in use, or the volume may be 0. See whether the bar moves when you speak.", r: "If the bar does not move → sound is not coming in." },
    "Check the microphone jack and connection, and test with another microphone": { c: "Microphone jack or device problem", m: "About 10 min", l: "Easy", w: "A microphone does not work if the jack position (pink) or the headset type is mismatched. Comparing with another microphone makes it certain.", r: "If another microphone works → the original microphone is the problem." },
    "Check camera access permission": { c: "Camera access permission", m: "About 5 min", l: "Easy", w: "As with the microphone, apps may be blocked from using the camera. It must be allowed for a picture to appear.", r: "If the picture appears after allowing it → it was a permission problem." },
    "Check whether another app is using the camera, and check the physical shutter": { c: "Camera held by another app, or shutter", m: "About 5 min", l: "Easy", w: "Only one app can use the camera at a time. If another app is using it, or the physical shutter is closed, nothing shows.", r: "If it shows after closing the other app or opening the shutter → it was the app or the shutter." },
    "Check that Bluetooth is on and the device is in pairing mode": { c: "Bluetooth off, or pairing state", m: "About 5 min", l: "Easy", w: "Bluetooth is found only when both the PC and the device are \"ready to connect\". Often one of the two is off.", r: "If it is found in pairing mode → it was a readiness problem." },
    "Remove the device that is already registered and add it again": { c: "Error in the old pairing information", m: "About 10 min", l: "Easy", w: "Old connection information left behind can stop a new connection. Deleting it and registering again is clean.", r: "If it connects after adding it again → the connection information was tangled." },
    "Check that a Bluetooth adapter is detected": { c: "No Bluetooth adapter, or driver", m: "About 10 min", l: "Moderate", w: "Some desktops have no Bluetooth at all. You can tell by whether there is a Bluetooth entry in Device Manager.", r: "If there is no entry → you need a Bluetooth adapter (dongle)." },
    "Check the distance and interference": { c: "Distance or radio interference", m: "About 10 min", l: "Easy", w: "Bluetooth drops out when it is far away or there is radio interference from a router or microwave oven. Keep it close and check.", r: "If it becomes stable when closer → it is a distance or interference problem." },
    "Turn off USB selective suspend": { c: "USB power saving setting", m: "About 10 min", l: "Moderate", w: "Windows sometimes switches a USB device off for a moment to save power, and it drops out. Turn that option off.", r: "If the dropouts disappear after turning it off → the power saving setting was the cause." },
  });
})();
