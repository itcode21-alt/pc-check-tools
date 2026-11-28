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
        { t: "Device Manager shows a yellow exclamation mark and an error code such as \"Code 43\"", icon: "usb", next: "r_dmcode" },
        { t: "After connecting a monitor (HDMI or DP) there is no sound from the PC speakers", icon: "speaker", next: "r_hdmiaudio" },
        { t: "I hear sound in my headset but the microphone does not work", icon: "headphones", next: "r_headsetmic" },
        { t: "The microphone works in Windows but not in a particular program (Discord, a game, video calls)", icon: "mic", next: "r_micapp" },
        { t: "The Camera app works but the camera does not show in video-call programs", icon: "camera", next: "r_camapp" },
        { t: "Bluetooth is not found after shutting the PC down and turning it on, but works after a restart (or the on button is gone)", icon: "bluetooth", next: "r_btboot" },
        { t: "A wireless keyboard or mouse keeps disconnecting or is suddenly not detected", icon: "keyboard", next: "r_wireless" },
        { t: "When I press several keys at once, some of them are not entered", icon: "key", next: "r_ghost" },
        { t: "A Bluetooth device cannot be found", icon: "bluetooth", next: "r_bt" },
        { t: "A USB device is not detected", icon: "usb", next: "r_usb" },
        { t: "Controller or gamepad not detected, or not working in a game", icon: "gamepad", next: "r_gamepad" },
      ],
    },
    r_gamepad: {
      mode: "remote",
      title: "For a gamepad, first tell whether Windows detects it, then check the connection and game settings",
      lead: "Gamepad problems split into cases where Windows does not detect it and cases where Windows detects it but only a particular game fails, and the causes and fixes differ.",
      steps: [
        {
          t: "First check whether Windows detects the gamepad",
          tools: [],
          how: [
            "Connect the gamepad, press Win+R, type joy.cpl and click OK. The Game Controllers list opens.",
            "Or open Settings (Win+I) > Bluetooth & devices and see whether the gamepad is in the list.",
            "If it is in the list, Windows has detected it. Then look at the game's settings (next step).",
            "If it is not in the list, the problem is at the Windows detection stage. Check the cable, port, battery and pairing in that order.",
            "Noting whether Windows detects it helps when you ask for help.",
          ],
        },
        {
          t: "Swap the cable, USB port and hub to compare",
          tools: [],
          how: [
            "If you are going through a USB hub, remove the hub and plug directly into the PC.",
            "If possible, plug into a USB port on the back of the PC.",
            "Try a different cable. With a charge-only cable the pad's light may come on but the PC does not see it as a device, because it has no data wires.",
            "Each time you swap, check whether it appears in the joy.cpl list.",
            "If it is detected with another cable or port, the original cable or port is the cause.",
          ],
        },
        {
          t: "Delete the Bluetooth pairing and connect again from scratch",
          tools: [],
          how: [
            "Replace or recharge the pad's battery. A low battery also makes it drop out or fail to connect.",
            "In Settings (Win+I) > Bluetooth & devices, click the three dots on the existing pad entry and choose \"Remove device\".",
            "Put the pad into pairing mode (the button combination differs per pad, so check its manual).",
            "Connect it fresh with \"Add device\" > \"Bluetooth\".",
            "If the connection keeps dropping, connect it by cable and see whether the same symptom appears. A cable has less lag and fewer drops than Bluetooth, so it is a good baseline for comparison.",
          ],
        },
        {
          t: "Check the in-game input device setting and the platform's controller settings",
          tools: [],
          how: [
            "This is the case where Windows detects it but only a game fails. In the game's input or controller settings, switch the input device to the controller directly.",
            "Some games prefer the keyboard when keyboard and pad input are detected at the same time. Do not touch the keyboard or mouse for a moment and press only the pad.",
            "A platform's controller settings, such as Steam's, can pass input on as a virtual controller. Reset that game's controller settings to default, or briefly turn off the platform's controller support option, and compare.",
            "Xbox-type pads mostly use XInput, while some third-party pads and older games use DirectInput. If the method does not match, some buttons may not work even though it is detected.",
            "If the same symptom appears in other games too, it is more likely Windows or the pad. Also check on the store page whether the game officially supports pads.",
          ],
        },
        LIMIT("If it is not detected on another PC either, the pad itself may be broken. Check the maker's warranty period first."),
      ],
      guides: [],
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
    r_dmcode: {
      mode: "remote",
      title: "For a Device Manager error code, note the code, then reinstall the driver and compare ports and PCs",
      lead: "If there is a yellow exclamation mark next to a device name, first write down the device name and the error code. A driver-search program or a registry edit is not the first step. For Code 43 (Windows has stopped this device), Microsoft's documentation says to remove the device, scan for hardware changes and reinstall the driver.",
      steps: [
        {
          t: "Write down the device name and the error code",
          tools: [],
          how: [
            "Right-click the Start button and open \"Device Manager\".",
            "Right-click the device with the yellow exclamation mark and open \"Properties\".",
            "On the \"General\" tab, write down the text under \"Device status\" and the error code (for example Code 43).",
            "If several devices show warnings, also note which device seems to be the problem first.",
          ],
        },
        {
          t: "Remove the device, scan for hardware changes and reinstall the driver",
          tools: [],
          how: [
            "In Device Manager, right-click the device and choose \"Uninstall device\". This does not erase the data on a storage device.",
            "After the removal, choose \"Action\" > \"Scan for hardware changes\" in the top menu so the driver is installed again.",
            "If it asks for the driver location, point it to the latest driver from the manufacturer's site.",
            "For a graphics card, you can remove the old driver completely and install the latest version. Restart and check whether the code is gone.",
          ],
        },
        {
          t: "Compare with another port or slot and another PC",
          tools: ["Another PC or another USB port"],
          how: [
            "For a USB device, plug it into another port (the back of the PC if possible) and see whether the same code appears. If it works on another port, the original port or cable is the cause.",
            "If you can, connect it to another PC and check whether the same warning appears. If it does, the device itself is likely at fault.",
            "This comparison is a general check that is not in Microsoft's documentation, but it helps separate the port, the cable and the device.",
          ],
        },
        LIMIT("If the same code appears on another port or PC, or a temperature or power problem of a graphics card is suspected, the device itself needs checking, so it is safer to ask for help."),
      ],
    },
    r_hdmiaudio: {
      mode: "remote",
      title: "If sound disappears after connecting a monitor by HDMI or DP, the default output may have switched to the monitor",
      lead: "When you connect a monitor by HDMI or DisplayPort, Windows often switches the default output to the monitor's speaker (or an audio device that goes through the monitor). If \"display audio\" becomes the default even though the monitor has no speaker, nothing comes out of the real speakers or earphones.",
      steps: [
        S.soundOutput,
        {
          t: "Set the default output to the real speakers or earphones",
          tools: [],
          how: [
            "Right-click the speaker icon in the taskbar and open \"Sound settings\".",
            "Under \"Output\", if the monitor name or \"display audio\" is selected, choose the real speakers or earphones (for example \"Speakers\" or \"Headphones\") as the default device.",
            "If the speakers are not in the list, check \"All sound devices\" for a device that is set to disabled.",
            "If the default device changes every time you unplug and plug the monitor cable, you may have to set it again each time.",
          ],
        },
        {
          t: "Turn off audio enhancements and spatial sound to return to the default",
          tools: [],
          how: [
            "In Sound settings, select the output device you use and open \"Device properties\" (or the \"Enhancements\" tab).",
            "Turn off audio enhancements and \"Spatial Sound\".",
            "If the device looks normal but the sound is completely cut, this feature may not fit the latest driver.",
            "Check whether sound comes out.",
          ],
        },
        LIMIT("If there is still no sound after fixing the default output and the effects, and the audio device is not shown, the audio driver may be at fault, so it is safer to ask for help."),
      ],
    },
    r_headsetmic: {
      mode: "remote",
      title: "If you hear sound but the headset microphone does not work, check the plug and the jack type first",
      lead: "If you plug a 4-pole (microphone-capable) headset, with two black bands on the end of the plug, into the split jacks on the back of a desktop (green for headphones, pink for the microphone), you hear sound but no microphone signal goes in. That is not a faulty microphone but a jack type that does not match.",
      steps: [
        {
          t: "Check the plug type and the jack you used",
          tools: [],
          how: [
            "Look at the number of black bands on the end of the headset plug. Two bands mean a 4-pole plug that includes the microphone.",
            "If the jacks on the back of a desktop are split into green (headphones) and pink (microphone), one 4-pole plug alone does not connect the microphone.",
            "On a laptop's combined headset jack, the same symptom appears if the plug is not pushed in all the way. Check that it is fully inserted.",
            "Use a splitter cable that divides a 4-pole plug into separate headphone and microphone plugs, or switch to a USB headset, and compare.",
          ],
        },
        {
          t: "Check microphone access and the default input device",
          tools: [],
          how: [
            "In Settings > Privacy & security > Microphone, check that \"Microphone access\" and the permission for the app you use are on.",
            "In the input device list under Settings > System > Sound, set the microphone you want to use as the default device.",
            "Watch whether the input test bar moves when you speak. If it moves, input is coming in at the system level.",
          ],
        },
        S.otherPc,
        LIMIT("If the microphone still does not work with a splitter cable or a USB headset, and it is the same on another PC, the headset may be faulty. If it fails only on this system, it is safer to ask for help to check the audio driver."),
      ],
    },
    r_micapp: {
      mode: "remote",
      title: "If it works in Windows but only one program fails, choose the microphone again in that program",
      lead: "In this case it is very likely not a hardware or driver problem but a problem with the microphone the program is set to use. Before reinstalling the program, choose the input device again in the program's audio settings.",
      steps: [
        {
          t: "First check at the system level that the microphone input arrives",
          tools: [],
          how: [
            "In Settings > System > Sound, set the microphone you want to use as the default input device.",
            "Watch whether the \"Test your microphone\" bar moves when you speak.",
            "If it does not move, look at the system or hardware instead of the program, and go to the \"microphone not detected\" symptom above.",
            "If it moves, go to the next step.",
          ],
        },
        {
          t: "Choose the input device again in the program's audio settings",
          tools: [],
          how: [
            "In Discord use Settings > Voice & Video, and in a game use its audio settings, and set the input device to the same microphone as the system default.",
            "If a webcam's built-in microphone, a headset microphone and a USB microphone are all connected, an unintended device can become the default. Set the devices you do not use to \"Disable\" in Sound settings to reduce the confusion.",
            "Close the program, open it again and check.",
          ],
        },
        {
          t: "Turn off exclusive use of the microphone by another program",
          tools: [],
          how: [
            "In Sound settings, select the microphone and open \"Device properties\" > \"Additional device properties\" > \"Advanced\" tab.",
            "If \"Allow applications to take exclusive control of this device\" is on, input may not reach another program while one program holds the microphone.",
            "Turn this option off, or close the program you opened first (such as a video call) and test again.",
          ],
        },
        LIMIT("If only one program keeps failing after sorting out its settings and exclusive use, the program's settings or an update may be the cause, so it is safer to ask for help."),
      ],
    },
    r_camapp: {
      mode: "remote",
      title: "If the Camera app works but a video-call program does not, check its settings, who is using the camera, and security software",
      lead: "If the Camera app works, the webcam and Windows detection are fine. Separate the cases where the program's camera setting points to another device, another program is using the webcam, or a physical shutter, security software or an administrator policy blocks it.",
      steps: [
        {
          t: "Check the program's camera setting and whether another program is using the camera",
          tools: [],
          how: [
            "In the settings of the video-call or broadcast program, check that the camera device is set to the webcam you want to use.",
            "Close every video-call, broadcast or camera program you are not using and try again.",
            "In Settings > Privacy & security > Camera, check that \"Camera access\" and the access of that app (including desktop apps) are on.",
          ],
        },
        {
          t: "Check the laptop camera shutter, function key and the security software's webcam protection",
          tools: [],
          how: [
            "Some laptops can turn the camera off with a physical privacy shutter or an Fn shortcut. Check that the shutter is not closed and press the function key with the camera icon on the keyboard to see if it turns on.",
            "Some antivirus and security products have a webcam protection (camera access blocking) option, which blocks a program that is not on the allow list when it opens the camera and turns the picture black. If only a newly installed video program fails, look in the security software's webcam protection item and block records for that program.",
            "If the privacy setting switches are grayed out and locked on a work or school PC, an administrator has blocked it by policy, so contact the organization that owns the PC.",
          ],
        },
        LIMIT("If the camera still does not show in that program after these checks, its settings or an update may be the cause, so it is safer to ask for help."),
      ],
    },
    r_btboot: {
      mode: "remote",
      title: "If Bluetooth is missing after a shutdown but works after a restart, compare Fast Startup and the service state",
      lead: "If it works after a restart but Bluetooth devices are not shown after a shutdown and power-on, the cause may be a state-reset problem rather than a faulty adapter. If the Bluetooth on button disappeared from Settings, first tell apart a missing button in Quick Settings from a missing adapter in Device Manager.",
      steps: [
        {
          t: "Turn off Fast Startup and compare whether the symptom changes",
          tools: [],
          how: [
            "Open Control Panel > Power Options > \"Choose what the power buttons do\".",
            "Click \"Change settings that are currently unavailable\", clear \"Turn on fast startup\" and save.",
            "Shut the PC down, turn it on again and check whether the Bluetooth device is found.",
            "If a restart worked and only the boot after a shutdown was the problem, this comparison tells you the cause.",
          ],
        },
        {
          t: "Check the Bluetooth Support Service and the adapter in Device Manager",
          tools: [],
          how: [
            "Press Win+R and open services.msc to check that the \"Bluetooth Support Service\" is running. The default startup type is Manual (Trigger Start), so it is enough that it has not been changed to Disabled.",
            "In Device Manager, turn on View > \"Show hidden devices\" and see whether the Bluetooth adapter is there and whether it has a yellow exclamation mark.",
            "For a USB Bluetooth dongle, plug it directly into another port on the PC and check first that the hardware is detected.",
            "If the adapter has an exclamation mark or disappears after waking from sleep, try updating the driver, reinstalling it and rolling it back, in that order, and prefer the manufacturer's driver.",
          ],
        },
        LIMIT("If it is the same after the Fast Startup and service checks, the adapter or driver may be at fault, so it is safer to ask for help."),
      ],
    },
    r_wireless: {
      mode: "remote",
      title: "If a wireless keyboard or mouse drops, check the battery, the receiver, interference and power settings in that order",
      lead: "A wireless device is checked in a different order from a wired one. First check the battery and the receiver connection, then the pairing, interference and USB power management. For a Bluetooth device, also check the state of the Bluetooth driver separately.",
      steps: [
        {
          t: "Replace the battery, re-plug the receiver and re-pair",
          tools: ["A new battery (if you have one)"],
          how: [
            "Replace the battery with a new one.",
            "Unplug the USB receiver and plug it in again. Plug it directly into a USB port on the back of the PC without going through a USB hub.",
            "If the pairing was lost, pair again with the device's reset button.",
            "Also try a full restart that bypasses Fast Startup: hold the Shift key and choose Start > Power > Restart.",
          ],
        },
        {
          t: "Check receiver interference and USB selective suspend",
          tools: [],
          how: [
            "If several 2.4 GHz wireless receivers are plugged into one USB hub, signal interference can make detection unstable. Spread the receivers over ports that are far apart.",
            "Interference from other 2.4 GHz devices such as a router or a Bluetooth speaker can also be the cause, so keep the receiver close to the keyboard or mouse and compare.",
            "Try disabling \"USB selective suspend\" in the power settings (Control Panel > Power Options > Change advanced power settings > USB settings).",
            "For products such as Logitech or Razer, check in the manufacturer's own software whether there is a firmware update.",
          ],
        },
        S.deviceMgr,
        LIMIT("If it keeps dropping after sorting out the battery, receiver and interference, or it is the same on another PC, the device may be faulty, so it is safer to ask for help."),
      ],
    },
    r_ghost: {
      mode: "remote",
      title: "If it fails only when pressing several keys at once, suspect the keyboard's simultaneous-input (ghosting) limit",
      lead: "Because of their circuit design, low-cost keyboards may not register some input when certain key combinations are pressed together. This is called ghosting and is often seen when several keys are pressed at once, as in games. Keyboards that support N-key rollover (NKRO) do not have this problem.",
      steps: [
        {
          t: "Use a key test to see whether every key pressed together responds",
          tools: [],
          how: [
            "Open the keyboard test on this site's device test page (or another keyboard tester).",
            "Press the key combination that causes the problem (for example the direction keys plus jump plus attack in a game) and see whether every key responds.",
            "If one or two keys drop out, it may be ghosting or the keyboard's limit for simultaneous input.",
            "Compare with other key combinations and with another keyboard.",
          ],
        },
        {
          t: "Check the keyboard's simultaneous-input support (NKRO) and the switch contacts",
          tools: [],
          how: [
            "Check in the keyboard's specification whether it supports N-key rollover (NKRO) or simultaneous input. If it is a low-cost model that does not, it is the keyboard's own limit.",
            "If the key is not dead but works sometimes and not at other times, the contacts of the switch or rubber dome may be worn and the contact unstable. Cleaning may help for a while, but if it comes back the keyboard needs to be replaced.",
            "Gaming keyboards have a game mode or Fn combination that deliberately locks the Windows key, and on a laptop the F1 to F12 keys behave differently depending on the Fn Lock state. Also check that such settings are not blocking input.",
          ],
        },
        LIMIT("If you need simultaneous input, replacing the keyboard with one that supports NKRO may be the solution. If a contact fault is suspected, it is safer to ask for help."),
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
    "First check whether Windows detects the gamepad": {"c": "Telling apart whether Windows detects it", "m": "About 3 min", "l": "Easy", "w": "A pad that Windows cannot see and one that fails only in a game have completely different causes, so first find where it gets stuck.", "r": "If it is in the list → look at the game's settings. If not → look at the connection."},
    "Swap the cable, USB port and hub to compare": {"c": "A charge-only cable, port or hub problem", "m": "About 5 min", "l": "Easy", "w": "A charge-only cable lights up but the PC does not see the device. A poor contact in the port or hub is also common.", "r": "If it is detected with another cable or port → the cable or port is the cause."},
    "Delete the Bluetooth pairing and connect again from scratch": {"c": "Tangled Bluetooth pairing or a low battery", "m": "About 10 min", "l": "Easy", "w": "Old pairing data that got tangled, or a low battery, makes it fail to connect or drop. Connecting again from scratch often fixes it.", "r": "If it is detected after reconnecting → it was a pairing problem."},
    "Check the in-game input device setting and the platform's controller settings": {"c": "Per-game input settings and platform controller settings", "m": "About 10 min", "l": "Easy", "w": "If Windows sees it but only the game fails, the cause is usually the game's input device setting or a platform setting.", "r": "If it works in other games → it is that game's setting. If it fails everywhere → it is Windows or the pad."},
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
