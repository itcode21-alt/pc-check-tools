(() => {
  // English edition of the screen problems self-check (wizard-display.js). Behavior lives in symptom-wizard.js, screen
  // text in wizard-ui-en.js. A faithful translation of the Korean wizard: no new claims. Windows menu names are the
  // English Windows 11 names. Links to Korean-only guides and tools are left out.
  const OPEN_DESKTOP = "You need to open the side panel of the case";
  const SAFE_OFF = "Shut Windows down, unplug the power cord from the back of the PC, then hold the power button for 3 to 5 seconds to drain the remaining electricity. After that, if the PSU (power supply) has a switch on its back, flip it to O (off).";
  const DRV = "A Phillips screwdriver (not needed if the side panel uses thumbscrews)";
  const LIMIT = (text) => ({ limit: true, t: text });

  const S = {
    cable: {
      t: "Re-seat the video cable and try another cable or port",
      tools: ["Another video cable (HDMI or DisplayPort, if you have one)"],
      spare: "If you have a spare cable that you know works (a used one is fine) or another monitor, swapping it in to test is recommended.",
      how: [
        "Switch the PC and the monitor off. You do not need to unplug the power cords, but it is safer to have both devices off when you unplug the video cable.",
        "Unplug the video cable (HDMI or DisplayPort) at both the PC end and the monitor end and plug it back in all the way. It is often sitting slightly loose. A DisplayPort cable has to be unplugged while pressing its latch.",
        "On a PC with a separate graphics card, check that the cable is plugged into a graphics card port (the lower area at the back of the PC where the ports are grouped side by side). If it is in the motherboard's ports (the upper area, near the USB and LAN ports), there may be no picture or low performance.",
        "If you have another cable, swap it in. If the monitor and the graphics card each have several ports, also try the other ports.",
        "Note whether the symptom changes each time you swap. If it changes when you change the cable or port, it is that cable or port; if it stays the same, the cause is something else.",
      ],
    },
    refresh: {
      t: "Lower the refresh rate and check",
      tools: [],
      how: [
        "Open Settings (Win+I) > System > Display.",
        "Click \"Advanced display\" at the bottom. If you have several monitors, choose the one with the symptom under \"Choose a display\" at the top.",
        "Open the \"Choose a refresh rate\" box in the \"Display information\" area.",
        "Choose a value lower than the current one (for example 60 Hz if you are using 144 Hz). If the screen goes dark for a moment and comes back, click \"Keep changes\". If you do not click within 15 seconds, it returns to the original value.",
        "After lowering it, use it for about 10 minutes to see whether the symptom (flicker, stripes, corruption) disappears.",
        "If the symptom disappears, the cable standard or the monitor or driver settings may not be able to handle the high refresh rate. Also check the cable standard in the next step.",
      ],
    },
    driverUpdate: {
      t: "Update the graphics driver, or roll it back",
      tools: [],
      how: [
        "Right-click the Start button and open \"Device Manager\".",
        "Expand \"Display adapters\" and check the graphics device names. Built-in (Intel UHD and so on) and separate (NVIDIA, AMD) graphics may both appear.",
        "Update: from the support page of the graphics card maker (NVIDIA, AMD, Intel) or of the laptop maker, download and install the latest driver for your model. For a laptop, we recommend the driver on the laptop maker's site first.",
        "Roll back: if the symptom started right after an update, right-click the device → Properties → \"Driver\" tab → \"Roll Back Driver\". In the window that asks the reason, choose any item and click \"Yes\".",
        "If the \"Roll Back Driver\" button is disabled (gray), there is no earlier record to go back to. In that case, download an earlier version of the driver from the maker's site and install it.",
        "After installing or rolling back, restart and check whether the symptom changes.",
      ],
    },
    safeMode: {
      t: "Check whether the same symptom appears in Safe Mode",
      tools: [],
      how: [
        "Save any document you are working on. Open Settings > System > Recovery.",
        "Next to \"Advanced startup\", click \"Restart now\". When it restarts, a blue selection screen appears.",
        "Click \"Troubleshoot\" → \"Advanced options\" → \"Startup Settings\" → \"Restart\" in turn.",
        "After the restart, press 4 (or F4, Enable Safe Mode) in the \"Startup Settings\" list. If you need the network, press 5 (F5, Enable Safe Mode with Networking).",
        "Safe Mode runs with a basic driver, so if the screen is normal, the installed graphics driver or a program is the likely cause. If the same symptom appears in Safe Mode too, the hardware, such as the cable, the monitor or the graphics card, is the likely cause.",
        "After checking, restart the PC to return to normal mode.",
      ],
    },
    monitorSwap: {
      t: "Connect it to another monitor (or another PC) to tell whether the monitor is the problem",
      tools: ["Another monitor or TV, or another PC to connect the same monitor to"],
      spare: "If you can borrow a spare monitor (a used one is fine), it is good to use for testing.",
      how: [
        "First connect the monitor that has the symptom to another PC or laptop. If you use the same cable, it is hard to tell a cable problem from a monitor problem, so if possible also use a different cable.",
        "Watch for 5 to 10 minutes to see whether the same symptom appears.",
        "Then do the reverse: connect another monitor (or a TV) to this PC and see whether the symptom disappears.",
        "If the symptom follows the monitor when you change monitors (it appears on the other PC too), the monitor itself is the likely cause. If it appears only on the PC, the PC (the graphics, the cable or the settings) is the likely cause.",
        "Give the test results when you ask for help.",
      ],
    },
    dust: {
      t: "Check the graphics card temperature and dust",
      tools: ["A temperature monitoring program (for example HWiNFO, a free tool you can install)", DRV, "Compressed air or a soft brush (for removing dust)"],
      needs: OPEN_DESKTOP + " · when removing dust",
      how: [
        "Install a temperature monitoring program (for example HWiNFO) and find the graphics card temperature (GPU Temperature) on the sensors screen.",
        "While you do the game or task that shows the symptom, see how high the temperature goes. Check whether it goes very high. The normal range is in the graphics card maker's specifications.",
        "If it goes high, switch the PC off, unplug the cord and open the side panel.",
        "Blow the dust off the graphics card fans and the case fans. Gently hold the blades so the fan does not spin freely, and blow it off with a soft brush or compressed air in short bursts.",
        "After removing the dust, switch on again and check whether the fans spin normally and whether the temperature went down in the same task.",
      ],
    },
    gpuPower: {
      t: "Check the graphics card's extra power cable and how it is seated",
      tools: [DRV],
      needs: OPEN_DESKTOP,
      how: [
        SAFE_OFF,
        "Open the side panel and check that the graphics card's extra power cable (6-pin, 8-pin, 12-pin and so on) is plugged in all the way. If it is loose, press it in until the latch clicks.",
        "Cables for the graphics card often have \"PCIe\" (or \"VGA\") printed near the connector. Check the marking so that you do not swap it with the similar-looking \"CPU\" cable.",
        "Check that the graphics card is pushed fully into its slot and not lifted on one side. Also check that the fixing screw at the back of the case is fastened.",
        "Plug the power cord in, switch on and check whether the symptom changes.",
      ],
    },
    gpuIgpu: {
      onlyGpu: "igpu",
      t: "Test with the built-in graphics (remove the graphics card and connect to the motherboard port)",
      tools: [DRV],
      needs: OPEN_DESKTOP,
      how: [
        SAFE_OFF,
        "Open the side panel and unplug the graphics card's extra power cable. Undo the fixing screw at the back of the case, and pull the graphics card straight out while pressing the slot latch. Support it with one hand.",
        "Plug the monitor cable into the monitor port on the back of the motherboard (HDMI or DisplayPort, the upper area near the USB and LAN ports). Also set the monitor's input source to that port.",
        "Plug the power cord in and switch on. Wait 20 to 30 seconds.",
        "If the symptom disappears on the built-in graphics, the problem is likely on the original graphics card (or its slot or extra power) side. If the symptom stays the same, suspect a cause other than the graphics card.",
        "When the test is over, switch the PC off, put the graphics card back as it was and put the monitor cable back as well.",
      ],
    },
    gpuTestCard: {
      onlyGpu: "noigpu",
      t: "Swap in a test graphics card (for a CPU with no built-in graphics)",
      tools: [DRV, "A test graphics card (a used or spare one is fine, one you know works)"],
      spare: "A CPU with no built-in graphics can only be tested with a separate working graphics card. Borrowing one from an acquaintance, or getting a cheap used one for testing, is recommended.",
      needs: OPEN_DESKTOP,
      how: [
        SAFE_OFF,
        "Open the side panel and unplug the extra power cable of the current graphics card. Undo the fixing screw and pull the graphics card straight out while pressing the latch.",
        "Push the test graphics card into the same slot all the way until the latch clicks shut, and tighten the fixing screw.",
        "If the test card is a model that needs extra power, also plug in the PCIe extra power cable.",
        "Plug the monitor cable into the test graphics card's port, plug the power cord in and switch on. Use it for about 10 minutes to see whether the symptom disappears.",
        "If the symptom disappears, the problem is likely on the original graphics card. After the test, switch the PC off and put the original card back as it was.",
      ],
    },
  };

  const NODES = {
    start: {
      q: "What is wrong with the screen?",
      hint: "Pick the one symptom that is closest.",
      options: [
        { t: "The screen flickers or shakes", icon: "pulse", next: "r_flicker" },
        { t: "I see stripes, broken color blocks or strange patterns", icon: "grid", next: "artq" },
        { t: "I connected an external monitor or TV and nothing shows, or only one screen shows", icon: "dual", next: "r_extmon" },
        { t: "The colors look wrong (yellowish, bluish or dull)", icon: "contrast", next: "r_color" },
        { t: "The refresh rate (Hz) won't change to the value I want", icon: "gauge", next: "r_refresh" },
        { t: "After signing in to Windows I see a black screen with only the mouse cursor", icon: "moon", next: "r_blackafter" },
        { t: "The screen goes dark and comes back during a game or work, or \"Display driver stopped responding\" appears", icon: "loop", next: "r_driver" },
        { t: "In games or video the picture looks split sideways and torn", icon: "monitor", next: "r_tearing" },
        // The "PC switches on but there is no picture" option links to /en/pc-boot-check.html; it is added when the English boot self-check ships.
      ],
    },

    r_tearing: {
      mode: "remote",
      title: "Screen tearing is, most of the time, a sync setting, not a fault",
      lead: "Tearing, where the picture looks split sideways in games or video, happens when the graphics output and the monitor display speed do not match. Check sync, refresh rate and the frame limit in that order.",
      steps: [
        {
          t: "Turn on V-Sync and see whether the tearing disappears",
          tools: [],
          how: [
            "In the game's graphics menu, turn on \"V-Sync\" (vertical sync).",
            "Or turn on vertical sync in the 3D settings of a graphics program such as the NVIDIA Control Panel or AMD Software.",
            "Repeat the scene that was tearing (turning the view quickly) and see whether it lessened.",
            "Turning it on can add a little input delay, which may be noticeable in competitive games. In that case use the frame limit method below.",
            "If you leave in-game V-Sync, driver V-Sync and monitor G-Sync all on at once, you cannot tell which setting applies, so change them one at a time and compare.",
          ],
        },
        {
          t: "Check that the monitor refresh rate setting matches its specification",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Display > Advanced display. If you have several monitors, choose the right one at the top.",
            "Check whether the value shown under \"Choose a refresh rate\" matches the monitor specification (for example 144 Hz).",
            "If it is a high-refresh monitor still at 60 Hz, change it to a value it supports. If the screen goes dark for a moment, click \"Keep changes\".",
            "If the higher value is not in the list, the HDMI cable or port may not support a high refresh rate, so switch to a DisplayPort cable or an HDMI port the monitor supports and choose again.",
            "Tearing stands out the moment the frame rate goes above the monitor refresh rate, so it matters that the refresh rate is right.",
          ],
        },
        {
          t: "Check G-Sync / FreeSync and the frame limit",
          tools: [],
          how: [
            "Check whether the monitor supports G-Sync or FreeSync from its specification sheet, the NVIDIA Control Panel or AMD Software.",
            "If it does, check that it is turned on in both the monitor's OSD menu and the graphics driver settings.",
            "Variable refresh rate works only inside the range the monitor supports (for example 48 to 144 Hz). Above the upper limit it tears again, so set a frame limit just below the upper limit.",
            "In windowed or borderless games, Windows compositing gets in the way and the feature may not apply. Switch to exclusive fullscreen and compare.",
            "On a laptop, the built-in screen may not support variable refresh rate or may output through the integrated graphics, so connect an external monitor to a port on the discrete graphics side and compare whether the option appears.",
          ],
        },
        LIMIT("If stripes also show on the BIOS screen or in other programs, the cable or graphics card hardware may be the cause, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_flicker: {
      mode: "remote",
      title: "For flicker, sort it out in the order of cable, refresh rate and driver",
      lead: "Screen flicker and shaking are commonly caused by cable contact, the refresh rate setting and the graphics driver. Rule them out one by one, starting with the easy ones.",
      steps: [S.cable, S.refresh, S.driverUpdate, S.safeMode, S.monitorSwap, LIMIT("The checks after this (re-seating or swapping the graphics card) mean touching the hardware, so if that is hard to do yourself, it is safer to hand it over.")],
    },

    artq: {
      q: "Do you see the same stripes or corruption on the BIOS screen, the one with the manufacturer's logo when you switch the computer on?",
      hint: "The BIOS screen is output directly by the graphics card, independent of Windows or game software. If it is corrupted here too, hardware is the likely cause.",
      options: [
        { t: "Yes, it looks corrupted on the BIOS screen too", next: "r_arthw" },
        { t: "No, I only see it in Windows or in games", next: "r_artsw" },
        { t: "I haven't been able to check", next: "r_artsw" },
      ],
    },
    r_artsw: {
      mode: "remote",
      title: "If it is corrupted only in Windows or games, look first at software and settings",
      lead: "If the BIOS screen is normal, suspect settings and environment problems such as the driver, overclocking and temperature before the cable or the graphics card hardware.",
      steps: [
        {
          t: "Compare whether it appears only in a particular game",
          tools: [],
          how: [
            "Besides the game where you see the corruption, compare whether the same symptom appears in other games, in videos (YouTube) and when you move windows on the desktop.",
            "If it appears only in a particular game, lower that game's graphics settings (resolution, shadows, frame cap and so on). Also run the game client's \"verify file integrity\" (file check) in Steam, Battle.net and so on.",
            "Also check in the game maker's notices whether the game requires the latest graphics driver.",
            "If it appears in several places, the graphics driver or the hardware becomes more likely.",
            "Writing down when, and in which game or task, it appeared, with the time, helps when you ask for help.",
          ],
        },
        S.dust,
        {
          t: "Return the overclock, XMP and EXPO settings to their defaults",
          tools: [],
          how: [
            "If you use a graphics overclocking program such as MSI Afterburner, open it and return the settings to default with the \"Reset\" button. Also turn off the program's automatic start.",
            "Enter the BIOS (press Del or F2 repeatedly as soon as you switch on).",
            "Find the memory profile (XMP, EXPO, DOCP and so on) or the CPU overclock items and turn them off (Disabled or Auto). Depending on the board, they are in menus such as \"Ai Tweaker\", \"OC\" and \"Extreme Tweaker\".",
            "Press F10 to save and restart.",
            "Watch for a few days to see whether the same symptom appears at the defaults. If the symptom disappears, it is a settings problem, so turn them back on one at a time to find the setting that caused it.",
          ],
        },
        {
          t: "Reinstall the graphics driver",
          tools: [],
          how: [
            "From the graphics card maker's site (NVIDIA, AMD, Intel), download the latest driver for your graphics card model. For a laptop, we recommend the driver on the laptop maker's site first.",
            "Run the installer. With NVIDIA, choose \"Custom (Advanced)\" install and tick \"Perform a clean installation\" to install after removing the existing settings. For AMD and Intel, also check whether the installer has a reset option.",
            "It is normal for the screen to go dark for a moment during installation. Wait until the completion message appears.",
            "If you need a more thorough removal, there is a way to use a dedicated removal tool (a third-party tool) such as Display Driver Uninstaller in Safe Mode, but you do not have to if you are not used to it.",
            "After installing, restart the PC and check whether the symptom has disappeared.",
          ],
        },
        LIMIT("If it is still the same, the graphics card hardware may need to be checked, so it is safer to hand it over."),
      ],
    },
    r_arthw: {
      mode: "visit",
      title: "If it is corrupted on the BIOS screen too, suspect the cable and the graphics card hardware",
      lead: "If it is corrupted before Windows even appears, the problem is more likely in hardware such as the cable, the graphics card or the slot than in the driver.",
      igpu: true,
      steps: [S.cable, S.gpuPower, S.gpuIgpu, S.gpuTestCard, S.dust, LIMIT("If a graphics card or motherboard fault is suspected, a test of swapping in a working part is needed, so it is safer to hand it over.")],
    },

    r_extmon: {
      mode: "remote",
      title: "For an external screen, check the display mode, the input source and the cable first",
      lead: "When an external monitor or TV shows nothing or only one screen shows, sort it out in the order of Windows' display mode, the monitor's input source, the cable and the driver.",
      steps: [
        {
          t: "Choose the display mode again with Windows key + P",
          tools: [],
          how: [
            "Press the Windows key and the P key together on the keyboard. A list of \"PC screen only / Duplicate / Extend / Second screen only\" appears at the right of the screen.",
            "Choose a mode with the arrow keys and press Enter. Try one of \"Extend\", \"Duplicate\" or \"Second screen only\". It may have been a mode in which only one screen is on.",
            "Open Settings (Win+I) > System > Display. Expand \"Multiple displays\" and click the \"Detect\" button to look for the monitors again.",
            "Check that all the monitors appear in the screen layout diagram and that the monitor with the right number is on.",
            "Check whether the screen appears.",
          ],
        },
        {
          t: "Set the monitor's input source to the port you actually connected",
          tools: ["The monitor manual (to find the menu buttons, optional)"],
          how: [
            "Press the menu button of the monitor that shows nothing (the OSD, a small button or joystick at the bottom or back of the monitor) to open the menu.",
            "Look for items such as \"Input\", \"Source\" and \"Signal input\". The name differs by model.",
            "Choose the same input as the port you plugged the cable into (HDMI1, HDMI2, DP and so on). If there is \"Auto\", try leaving it on automatic.",
            "For a TV, set it the same way with the \"Input\" or \"Source\" button on the remote.",
            "After changing the input source, wait 10 to 20 seconds. Some monitors take time to find the signal.",
          ],
        },
        {
          t: "Connect the monitors one at a time on their own",
          tools: [],
          how: [
            "If several monitors are connected, unplug the video cables of all but one.",
            "Check whether a picture appears on the monitor you left.",
            "Plug the other monitors into the same port one at a time and test them the same way.",
            "If each works on its own and it fails only when they are connected together, lower the resolution and refresh rate, or remove a dock or hub and connect directly to compare.",
            "Note in which combination the symptom appears.",
          ],
        },
        S.cable,
        S.driverUpdate,
        LIMIT("If it still shows nothing, the graphics card or the port needs to be checked, so it is safer to hand it over."),
      ],
    },

    r_color: {
      mode: "remote",
      title: "If the colors look wrong, sort it out in the order of night light, monitor settings and cable",
      lead: "A yellowish, bluish or dull screen is often caused by Windows' night light, the monitor's color settings or cable contact.",
      steps: [
        {
          t: "Check whether Night light is on",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Display.",
            "See whether \"Night light\" is on. If it is on, turn it off or click \"Turn off now\". It is a common cause of a yellowish screen.",
            "If you want to keep it on, lower the strength slider.",
            "On the same screen, look at the \"HDR\" item. If it is on, the normal screen can look washed out, so try turning it off.",
            "Also check that the \"color profile\" (Advanced display > Display adapter properties > Color Management) is not a value you changed earlier.",
          ],
        },
        {
          t: "Reset the color settings in the monitor menu",
          tools: ["The monitor manual (to find the menu items, optional)"],
          how: [
            "Press the monitor's menu button (the OSD) to open the settings menu. It is a small button or joystick at the bottom or back of the monitor.",
            "Look for items such as \"Reset\", \"Factory Reset\" and \"Color Reset\". The name differs by model.",
            "If there is an item that resets only the color settings, choose that. A full reset returns every setting, so do it only when you need to.",
            "If a mode such as \"Color temperature\", \"Low Blue Light\" or \"Eye Care\" is on, try turning it off.",
            "After changing the settings, check whether the colors return.",
          ],
        },
        S.cable,
        S.monitorSwap,
        {
          t: "Check the color settings in the graphics driver control panel",
          tools: [],
          how: [
            "Right-click an empty spot on the desktop and see whether \"NVIDIA Control Panel\" is there. If not, look in the Start menu search for \"AMD Software\" or \"Intel Graphics Command Center\". Open the one that is installed.",
            "Open the display item \"Adjust desktop color settings\" (NVIDIA) or the color menu (AMD, Intel).",
            "Check that the brightness, contrast, gamma and digital vibrance values are at their defaults.",
            "If they have been changed, click \"Restore defaults\" (Reset).",
            "After changing the settings, check whether the colors return.",
          ],
        },
      ],
    },

    r_refresh: {
      mode: "remote",
      title: "If the refresh rate won't change, check the cable standard, the port you connected to and the settings",
      lead: "When the refresh rate the monitor supports does not appear, often the cable standard is too low, the monitor is plugged into a motherboard port, or the high refresh rate is turned off in the monitor settings.",
      steps: [
        {
          t: "Check the cable standard and the port you connected to",
          tools: ["The monitor specifications (the product manual or the maker's page)"],
          how: [
            "In the monitor specifications (the product manual or the maker's site), check the cable standard needed to reach the high refresh rate. Usually DP 1.2 or higher and HDMI 2.0 or higher are needed for a high refresh rate, but it differs by monitor.",
            "Check on the cable's packaging or markings whether your current cable supports that standard. If the cable is old or very long (3 m or more), its standard may be low or the signal weak.",
            "If you have a separate graphics card, check that the monitor cable is plugged into a graphics card port. The ports on the motherboard sometimes support a lower standard.",
            "Also check the port on the monitor side. If the monitor has several HDMI ports, not all the ports may be the same standard.",
            "If possible, test with a cable of a higher standard.",
          ],
          spare: "If you have a working cable that supports a high refresh rate (a used or spare one is fine), swapping it in is the surest way.",
        },
        {
          t: "Check the refresh rate list in Windows and choose",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Display > Advanced display.",
            "Under \"Choose a display\" at the top, pick the monitor you want to use at the high refresh rate.",
            "Open the \"Choose a refresh rate\" list in the \"Display information\" area.",
            "If the value you want is in the list, choose it and click \"Keep changes\".",
            "If it is not in the list, the problem is the cable standard, the graphics driver or the monitor menu settings. Go to the next step.",
          ],
        },
        {
          t: "Check the high refresh rate option in the monitor menu",
          tools: ["The monitor manual (to find the menu items, optional)"],
          how: [
            "Open the monitor menu (the OSD). It is a small button or joystick at the bottom or back of the monitor.",
            "Look for items such as \"Overclock\", \"Overdrive\", \"Refresh Rate\". The name differs by maker.",
            "If an option related to the high refresh rate is off, turn it on. Some monitors have a separate setting for each DP and HDMI port.",
            "Save and close the menu. The screen may go dark for a moment.",
            "Check the refresh rate list in Windows again (Settings > System > Display > Advanced display).",
          ],
        },
        S.driverUpdate,
      ],
    },

    r_blackafter: {
      mode: "remote",
      title: "For a black screen after signing in, check Explorer and the graphics driver first",
      lead: "A black screen with only the mouse cursor is often because Explorer (the desktop program) did not start, or because of the graphics driver or the external monitor settings.",
      steps: [
        {
          t: "Restart Explorer from Task Manager",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc on the keyboard to open Task Manager. It often responds even when the screen is black.",
            "If Task Manager opens small, click \"More details\" at the bottom to open the full view.",
            "On the \"Processes\" tab, if \"Windows Explorer\" is already there, right-click it and click \"Restart\". The taskbar disappears for a moment and comes back.",
            "If it is not there, click \"File\" → \"Run new task\" at the top, type explorer.exe and press Enter.",
            "Check whether the desktop and the taskbar come back. If they do not, restart the PC.",
          ],
        },
        {
          t: "The graphics driver restart shortcut, and removing the external monitor",
          tools: [],
          how: [
            "On the keyboard, press the Windows key + Ctrl + Shift + B at the same time. The screen may flicker for a moment and make a sound; that is the signal that the graphics driver is restarting.",
            "Wait a few seconds for the flicker to end.",
            "If you have an external monitor or TV connected, unplug all the video cables and check the screen again.",
            "Press the Windows key + P and try choosing \"PC screen only\".",
            "Check whether the screen comes back.",
          ],
        },
        S.safeMode,
        S.driverUpdate,
      ],
    },

    r_driver: {
      mode: "remote",
      title: "If the graphics driver keeps stopping, look first at overclocking, temperature and power",
      lead: "If the screen goes dark and comes back during a game, or \"Display driver stopped responding\" appears, suspect in order overclocking, overheating, the extra power or the PSU, and the driver.",
      steps: [
        {
          t: "Return the graphics overclock settings to their defaults",
          tools: [],
          how: [
            "If you use an overclocking program such as MSI Afterburner, open it and return the settings to default with the Reset button. If the program is set to apply automatically when Windows starts, turn that off as well.",
            "Also try turning off the automatic overclock (boost) function of the maker's own program (Armoury Crate, Predator, Alienware Command Center and so on).",
            "If a graphics-related overclock item is on in the BIOS, return it to the default.",
            "Run the same game again and check whether the symptom decreased.",
            "If it decreased, turn the settings back on one at a time to find the setting that caused it.",
          ],
        },
        S.dust,
        {
          t: "Reinstall the graphics driver",
          tools: [],
          how: [
            "From the graphics card maker's site (NVIDIA, AMD, Intel), download the latest driver for your graphics card model. For a laptop, we recommend the driver on the laptop maker's site first.",
            "Run the installer. With NVIDIA, choose \"Custom (Advanced)\" install and tick \"Perform a clean installation\" to install after removing the existing settings. For AMD and Intel, also check whether the installer has a reset option.",
            "It is normal for the screen to go dark for a moment during installation. Wait until the completion message appears.",
            "If you need a more thorough removal, there is a way to use a dedicated removal tool (a third-party tool) such as Display Driver Uninstaller in Safe Mode, but you do not have to if you are not used to it.",
            "After installing, restart the PC and check whether the symptom has disappeared.",
          ],
        },
        S.gpuPower,
        {
          t: "Check how often Display errors repeat in Event Viewer",
          tools: [],
          how: [
            "Type \"Event Viewer\" in the search next to the Start button and open it.",
            "On the left, choose \"Windows Logs\" → \"System\".",
            "Click \"Filter Current Log\" on the right, choose \"Display\" in the \"Event sources\" box and click OK.",
            "See how often and when Event ID 4101 (the display driver stopped responding and recovered) occurs.",
            "Note the times: whether it appears several times a day, or only when you play a particular game.",
            "Give this information when you ask for help.",
          ],
        },
        LIMIT("If it is still the same, the PSU's capacity and condition, or the graphics card, need to be checked, so it is safer to hand it over."),
      ],
    },
  };

  window.ITSVC_WIZARD = { nodes: NODES };

  // Per-step notes (c: cause candidate, m: rough time, l: difficulty, w: why, r: how to read the result, t: site tool key).
  // The time is a rough estimate based on the kind of task, not a measurement. Site tools that exist only in Korean are not linked.
  window.ITSVC_WIZARD_META = Object.assign(window.ITSVC_WIZARD_META || {}, {
    "Turn on V-Sync and see whether the tearing disappears": {"c": "Graphics output not synchronized with the monitor refresh", "m": "About 5 min", "l": "Easy", "w": "Tearing is two scenes overlapping in one frame because the graphics card draws at a different speed than the monitor displays, so turning on synchronization is the most effective fix.", "r": "If it disappears after turning it on → it was a sync setting, not a fault."},
    "Check that the monitor refresh rate setting matches its specification": {"c": "The refresh rate stuck at 60 Hz", "m": "About 5 min", "l": "Easy", "w": "On a high-refresh monitor stuck at 60 Hz, tearing becomes noticeable as soon as the frame rate goes above it.", "r": "If the setting is lower than the monitor specification → raise it, or check the cable and port."},
    "Check G-Sync / FreeSync and the frame limit": {"c": "Variable refresh range and whether it applies in windowed mode", "m": "About 10 min", "l": "Easy", "w": "Usually G-Sync or FreeSync still tears because the frame rate goes above the range or windowed mode stops the feature from applying.", "r": "If it disappears with a frame limit or fullscreen → variable refresh was not being applied properly."},
    "Re-seat the video cable and try another cable or port": { c: "Poor video cable or port contact", m: "About 5 min", l: "Easy", w: "Screen flicker is often caused by a loose or old cable. Re-seating it and swapping it is the easiest check.", r: "If it disappears after swapping the cable → the cable was the cause." },
    "Lower the refresh rate and check": { c: "Refresh rate setting, cable bandwidth", m: "About 5 min", l: "Easy", w: "If the cable or the monitor cannot keep up with a high refresh rate, the screen is unstable. Lower it and see whether the same symptom appears.", r: "If it disappears after lowering it → it cannot sustain the high refresh rate." },
    "Update the graphics driver, or roll it back": { c: "Graphics driver problem", m: "About 15 min", l: "Moderate", w: "The driver is the software that connects the graphics card and Windows. If a problem started right after an update, try rolling it back.", r: "If it is normal after rolling back or updating → the driver was the cause." },
    "Check whether the same symptom appears in Safe Mode": { c: null, m: "About 15 min", l: "Moderate", w: "Safe Mode starts with only the basic functions turned on. If there is no symptom there, a program or driver installed normally is to blame.", r: "If it is normal in Safe Mode → it is a software problem." },
    "Connect it to another monitor (or another PC) to tell whether the monitor is the problem": { c: "The monitor itself has a problem", m: "About 10 min", l: "Easy", w: "Connect the same monitor to another PC, or another monitor to this PC, and find which side the problem follows.", r: "If the symptom follows the monitor when you change it → it is the monitor." },
    "Compare whether it appears only in a particular game": { c: null, m: "About 10 min", l: "Easy", w: "If it happens in only one game, it is that game's settings or that game; if it happens everywhere, it is the driver or the hardware.", r: "If it appears only in one game → the cause is on that game's side." },
    "Check the graphics card temperature and dust": { c: "Graphics card overheating, dust", m: "About 15 min", l: "Moderate", w: "If the graphics card gets too hot, the screen corrupts or goes off. Looking at the temperature and the dust together shows whether it is overheating.", r: "If the temperature is high and there is a lot of dust → cleaning may help." },
    "Return the overclock, XMP and EXPO settings to their defaults": { c: "Overclock or memory profile settings", m: "About 10 min", l: "Moderate", w: "Settings that raise performance (overclocking, XMP and EXPO) occasionally cause instability. Return them to the defaults and compare.", r: "If it is normal at the defaults → that setting was the cause." },
    "Reinstall the graphics driver": { c: "Graphics driver problem", m: "About 20 min", l: "Moderate", w: "When the driver files are tangled, installing cleanly is better than just updating.", r: "If it is normal after reinstalling → the driver was tangled." },
    "Check the graphics card's extra power cable and how it is seated": { c: "Poor graphics card extra power contact", m: "About 10 min", l: "Moderate", w: "If the extra power cable is loose, the screen can go off when it uses a lot of power, such as in a game.", r: "If it improves after plugging it in firmly → it was a contact problem." },
    "Test with the built-in graphics (remove the graphics card and connect to the motherboard port)": { c: "The graphics card itself is faulty", m: "About 20 min", l: "Moderate", w: "If you take out the graphics card and output the picture from the graphics built into the CPU, you can tell whether the graphics card is the culprit.", r: "If it is normal on the built-in graphics → the problem is on the graphics card side." },
    "Swap in a test graphics card (for a CPU with no built-in graphics)": { c: "The graphics card itself is faulty", m: "About 30 min", l: "Careful", w: "A CPU with no built-in graphics can only be tested by swapping in another graphics card. You need a working card to compare.", r: "If it is normal with the other card → the original graphics card is the problem." },
    "Choose the display mode again with Windows key + P": { c: "Display mode setting", m: "About 3 min", l: "Easy", w: "It may not be that the screen does not appear, but that the mode has changed to something like \"Second screen only\". One shortcut checks it.", r: "If it appears after changing the mode → it was a display mode problem." },
    "Set the monitor's input source to the port you actually connected": { c: "Monitor input source setting", m: "About 5 min", l: "Easy", w: "If the monitor is looking at a different input from the port you connected, \"No signal\" appears even though the connection is fine.", r: "If it appears after matching the input → it was an input setting problem." },
    "Connect the monitors one at a time on their own": { c: null, m: "About 10 min", l: "Easy", w: "This separates a problem that happens only when several are connected together from a problem with one monitor.", r: "If each works and it fails only when connected together → it is a combination or bandwidth problem." },
    "Check whether Night light is on": { c: "Night light, color settings", m: "About 3 min", l: "Easy", w: "If Windows' night light is on, the screen looks yellowish. It is an eye-comfort feature, not a fault.", r: "If the colors come back after turning it off → night light was the cause." },
    "Reset the color settings in the monitor menu": { c: "Monitor color settings", m: "About 5 min", l: "Easy", w: "Color changes made in the monitor's own menu may still be there. Resetting returns it to the factory state.", r: "If the colors return after the reset → it was a monitor settings problem." },
    "Check the color settings in the graphics driver control panel": { c: "Graphics driver color settings", m: "About 5 min", l: "Easy", w: "The graphics driver program also has color adjustments, and if the values here go off, the colors look strange.", r: "If it is normal after restoring the defaults → it is a driver color settings problem." },
    "Check the cable standard and the port you connected to": { c: "Cable standard too low", m: "About 10 min", l: "Easy", w: "A high refresh rate needs a cable standard (HDMI 2.0 or DP 1.2 or higher) that supports it. An old cable sometimes cannot deliver it.", r: "If it is a low-standard cable → the cable needs replacing." },
    "Check the refresh rate list in Windows and choose": { c: "Refresh rate setting", m: "About 5 min", l: "Easy", w: "Windows shows the refresh rates it has detected for the monitor as a list. If a value is not in the list, it is the cable, the driver or the monitor.", r: "If the value you want is in the list → just choose it." },
    "Check the high refresh rate option in the monitor menu": { c: "Monitor high refresh rate option off", m: "About 5 min", l: "Easy", w: "Some monitors need the high refresh rate option turned on in the menu before the higher value is available.", r: "If it appears in the list after turning the option on → it was a monitor settings problem." },
    "Restart Explorer from Task Manager": { c: "Explorer (desktop) startup error", m: "About 5 min", l: "Easy", w: "A black screen after signing in is often because the desktop program (Explorer) did not start. You can start it yourself from Task Manager.", r: "If the desktop appears after running Explorer → it was an Explorer problem." },
    "The graphics driver restart shortcut, and removing the external monitor": { c: "Graphics driver, external monitor settings", m: "About 5 min", l: "Easy", w: "One shortcut turns the graphics driver off and on, to see whether the screen is released. An external monitor can also get in the way.", r: "If it appears after the restart or after removing the monitor → it is a driver or external screen setting problem." },
    "Return the graphics overclock settings to their defaults": { c: "Graphics overclock settings", m: "About 5 min", l: "Easy", w: "If the settings that raise the graphics performance are unstable, the screen goes off and comes back. Compare with the defaults.", r: "If the symptom decreases at the defaults → it is an overclock settings problem." },
    "Check how often Display errors repeat in Event Viewer": { c: null, m: "About 10 min", l: "Easy", w: "Windows records \"Display driver stopped responding\" in a log. Knowing how often and when it occurs helps gauge the cause.", r: "If it repeats at the same times → it is related to a particular task or load.", t: "eventLog" },
  });
})();
