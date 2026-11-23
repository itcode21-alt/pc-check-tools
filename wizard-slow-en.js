(() => {
  // English edition of the slowness, heat and noise self-check (wizard-slow.js). Behavior lives in symptom-wizard.js,
  // screen text in wizard-ui-en.js. A faithful translation of the Korean wizard: no new claims. Windows menu names are
  // the English Windows 11 names. Links to Korean-only guides and tools are left out; the one step bullet that pointed
  // to this site's Korean RAM upgrade checker now points to the PC or motherboard maker's support page.
  const OPEN_DESKTOP = "You need to open the side panel of the case";
  const SAFE_OFF = "Shut Windows down, unplug the power cord from the back of the PC, then hold the power button for 3 to 5 seconds to drain the remaining electricity. After that, if the PSU (power supply) has a switch on its back, flip it to O (off).";
  const DRV = "A Phillips screwdriver (not needed if the side panel uses thumbscrews)";
  const LIMIT = (text) => ({ limit: true, t: text });

  const S = {
    taskmgr: {
      t: "Check what is using the most in Task Manager",
      tools: [],
      how: [
        "Press Ctrl+Shift+Esc on the keyboard to open Task Manager. If it opens small, click \"More details\" at the bottom left to open the full view.",
        "Click the \"Performance\" tab on the left (or at the top) and watch the CPU, Memory and Disk graphs for a few minutes. See whether they stay high all the time or only spike now and then.",
        "Move to the \"Processes\" tab and click the CPU, Memory and Disk column headings once each to sort. The programs that use the most come to the top.",
        "Remember the name of the program that is highest. If you do not recognize the name, search the internet to find out what it is. Do not end Windows' own processes casually.",
        "Give the column that was high (which of CPU, Memory or Disk) and the program name when you ask for help.",
      ],
    },
    startup: {
      t: "Reduce the startup programs",
      tools: [],
      how: [
        "Open Task Manager with Ctrl+Shift+Esc. If it opens small, click \"More details\".",
        "Click the \"Startup apps\" tab (or \"Startup\").",
        "Find the items whose \"Startup impact\" column is \"High\". You can also click the column to sort.",
        "Right-click the items that are not really needed at boot (messengers, update helpers, game launchers and so on) and change them to \"Disabled\".",
        "Do not turn off items related to antivirus or device drivers. If you do not know the name, leave it alone.",
        "Restart and check whether the speed you feel after start-up has changed.",
      ],
    },
    storageFree: {
      t: "Check that you are not short of storage space, and clean it up",
      tools: [],
      how: [
        "Open Settings (Win+I) > System > Storage.",
        "On the C: drive bar, check the free space, and look at the usage by category (Apps, Temporary files, Documents and so on).",
        "Click \"Temporary files\", tick the items that are safe to delete such as Downloads, the Recycle Bin and temporary files, and click \"Remove files\". First check that the Downloads folder has nothing you need.",
        "If you turn on \"Storage Sense\", temporary files are cleaned up automatically.",
        "If the free space is below 10 to 15% of the total, the PC can get slow, so consider moving large files (videos, games) to another drive.",
        "After cleaning, check how much space was freed.",
      ],
    },
    malware: {
      t: "Run a full scan with Windows Security",
      tools: [],
      how: [
        "Type \"Windows Security\" in the Start menu search and open it.",
        "Click \"Virus & threat protection\".",
        "Click \"Scan options\", choose \"Full scan\" and click \"Scan now\".",
        "A full scan takes a long time (tens of minutes to a few hours depending on the storage size), so leave the PC on and wait. You can do other work, but it may be slower.",
        "If a threat is found, remove or quarantine it as instructed.",
        "If you use another antivirus, run the full scan of that program.",
      ],
    },
    safeMode: {
      t: "Check whether it is still slow in Safe Mode",
      tools: [],
      how: [
        "Save any document you are working on. Open Settings > System > Recovery.",
        "Next to \"Advanced startup\", click \"Restart now\". When it restarts, a blue selection screen appears.",
        "Click \"Troubleshoot\" → \"Advanced options\" → \"Startup Settings\" → \"Restart\" in turn.",
        "After the restart, press 4 (or F4, Enable Safe Mode) in the \"Startup Settings\" list.",
        "In Safe Mode only the minimum of programs run, so use Task Manager (Ctrl+Shift+Esc) to see whether the load disappears. If it does, a program that normally runs is the likely cause.",
        "After checking, restart the PC to return to normal mode.",
      ],
    },
    smart: {
      t: "Check the storage device's health (SMART)",
      tools: ["A disk health program such as CrystalDiskInfo (a free tool you can install)"],
      how: [
        "Download a program such as CrystalDiskInfo from its official website and install it. There is also a version you can unzip and run directly instead of installing.",
        "When you open the program, there are tabs at the top for each connected storage device, and its \"Health Status\" is shown.",
        "\"Good\" is the normal range. If it shows \"Caution\" or \"Bad\", or items such as \"Reallocated Sectors Count\" or \"Current Pending Sector Count\" have a value, the storage device is in poor condition.",
        "If the condition is poor, back up your important data to another place first and ask about replacing it.",
        "For an SSD, you can also interpret the result with this site's SSD health check tool. A screenshot of the result helps when you ask for help.",
      ],
    },
    temp: {
      t: "Check the temperature",
      tools: ["A temperature monitoring program (for example HWiNFO, a free tool you can install)"],
      how: [
        "Install a temperature program such as HWiNFO (official site hwinfo.com).",
        "When you run it, tick \"Sensors-only\" in the start window and click \"Run\".",
        "In the list, find the CPU temperature (CPU Package, Tdie and so on) and the graphics card temperature (GPU Temperature).",
        "Check the temperature at normal times (on the desktop) and when it is slow or the noise is loud. Also look at the maximum value (the Maximum column).",
        "If a high temperature stays for long, suspect the cooling (dust, fans, thermal paste). The normal range differs by product, so also check the maker's specifications.",
      ],
    },
    dust: {
      t: "Remove dust from inside the PC",
      tools: [DRV, "Compressed air or a soft brush", "Cotton swabs"],
      needs: OPEN_DESKTOP,
      how: [
        SAFE_OFF,
        "Open the side panel. Undo the two thumbscrews on the back of the case and slide the side panel back to open it.",
        "Look with your eyes at the dust that has piled up on the CPU cooler, the graphics card fans, the case fans and the front filter.",
        "Gently hold the fan blades with a cotton swab or a finger so they do not spin freely, and blow the dust off with compressed air or a soft brush. Spray the air in short bursts.",
        "Avoid putting a vacuum cleaner close to the parts, because it can create static electricity. Dust flies about, so work in a well-ventilated place.",
        "Close the side panel, switch on and check whether the fan rotation and the temperature have changed.",
      ],
    },
    powerMode: {
      t: "Check the power mode",
      tools: [],
      how: [
        "Open Settings (Win+I) > System > Power & battery.",
        "Find the \"Power mode\" item. On a laptop, \"On battery\" and \"Plugged in\" may be shown separately.",
        "If it is set to \"Best power efficiency\" (power saving), change it to \"Balanced\" or \"Best performance\".",
        "On a laptop, do the same task with the adapter connected to see whether the speed changes.",
        "After the change, do the same task and compare how fast it feels.",
      ],
    },
    fullRestart: {
      t: "Do a full restart",
      tools: [],
      how: [
        "Save any open work.",
        "Choose Start button → Power → \"Restart\". \"Shut down\" can keep some state because of Fast Startup, so Restart is more reliable.",
        "After the restart finishes, do not open several programs right away; leave it alone for about 5 minutes. Windows does background work just after start-up and can be slow.",
        "After that, use it as usual and see whether the symptom has changed.",
        "On a PC that has not been restarted for a long time, this alone sometimes improves it.",
      ],
    },
  };

  const NODES = {
    start: {
      q: "What is the problem?",
      hint: "Pick the one symptom that is closest.",
      options: [
        { t: "The computer has become slow overall", icon: "gauge", next: "slowq" },
        { t: "Booting (from switching on to the desktop) takes a long time", icon: "clock", next: "r_startup" },
        { t: "The fan suddenly got loud", icon: "fan", next: "r_fan" },
        { t: "The PC is hot and suddenly turns off while I use it", icon: "thermo", next: "r_heat" },
        { t: "The hard drive clicks or makes a scraping noise", icon: "drive", next: "r_hddnoise" },
        { t: "The graphics card makes a buzzing or whining high-pitched sound", icon: "chip", next: "r_coil" },
        { t: "The frame rate drops and stutters only in games", icon: "gamepad", next: "r_fps" },
        { t: "A window, the taskbar or clicking freezes, or \"Not responding\" appears", icon: "pointer", next: "freezeq" },
      ],
    },
    slowq: {
      q: "On the \"Performance\" tab of Task Manager (Ctrl+Shift+Esc), which item stays high?",
      hint: "Watch it for a few minutes while the PC is slow. If you are not sure, choose the last one.",
      options: [
        { t: "The disk stays close to 90 to 100%", next: "r_disk" },
        { t: "The CPU stays high", next: "r_cpu" },
        { t: "The memory is almost full", next: "r_mem" },
        { t: "All are low, or I'm not sure", next: "r_slowgen" },
      ],
    },
    freezeq: {
      q: "What is freezing?",
      hint: "Pick the closest one. What to check depends on how much still moves.",
      options: [
        { t: "File Explorer freezes, or the right-click menu appears late", icon: "folder", next: "r_explorer" },
        { t: "The Start menu or taskbar does not respond", icon: "grid", next: "r_taskbar" },
        { t: "The mouse moves but clicking does nothing", icon: "pointer", next: "r_click" },
        { t: "Only the browser (Chrome, Edge) freezes or shows \"Not responding\"", icon: "globe", next: "r_browser" },
      ],
    },
    r_explorer: {
      mode: "remote",
      title: "If Explorer freezes, tell apart slow devices and broken paths first",
      lead: "Explorer freezing is not just about having many files; a slow drive, a broken path or something attached to Explorer can be the cause. Start with what is easy to tell apart.",
      steps: [
        {
          t: "Restart only Explorer",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc to open Task Manager. If it opens small, click \"More details\" at the bottom left.",
            "On the \"Processes\" tab, find \"Windows Explorer\", right-click it and choose \"Restart\". If you cannot find it, type \"Explorer\" in the search box at the top.",
            "While it restarts, the taskbar and any open Explorer windows disappear for a moment and then come back. This is normal.",
            "If \"Windows Explorer\" is not in the process list, or the taskbar has disappeared completely, click \"Run new task\" at the top of Task Manager, type explorer.exe in the Open box and click OK.",
            "Repeat the action that was freezing (opening a folder, clicking the Start menu and so on) and check whether it frees up right away. If it does, the cause is more likely something attached to Explorer (a shell extension) or a list than the files themselves.",
          ],
        },
        {
          t: "Disconnect external drives and network drives, then compare",
          tools: [],
          how: [
            "Safely remove every USB stick and external hard drive. Click the USB icon at the bottom right of the taskbar, choose \"Eject\", then unplug it.",
            "Open \"This PC\" in File Explorer. If there are network drives, right-click each one and choose \"Disconnect\".",
            "Close File Explorer and open it again, then repeat the action that was freezing (especially opening \"This PC\").",
            "If the freezing is gone, reconnect the devices one at a time to find which one is the cause. A single faulty external drive or broken network drive can hold up the whole of Explorer.",
            "Write down the name of the device you suspect.",
          ],
        },
        {
          t: "Remove broken paths pinned in Quick access",
          tools: [],
          how: [
            "Check whether Explorer freezes as soon as you open it, or whether the Quick access list takes a long time to appear.",
            "If a pinned folder points to a NAS that is switched off, a disconnected external drive or a shared folder you can no longer reach, right-click it and choose \"Remove from Quick access\".",
            "In File Explorer, click the \"...\" menu at the top (or the View menu) and choose \"Options\" to open File Explorer Options.",
            "Under \"Privacy\", click \"Clear\" next to \"Clear File Explorer history\".",
            "Close and reopen File Explorer and compare whether the freezing has lessened.",
          ],
        },
        {
          t: "Check whether the search indexer is using the disk",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc to open Task Manager and look at the \"Processes\" tab.",
            "Check whether the disk usage of \"Microsoft Windows Search Indexer\" stays high. Clicking the \"Disk\" column heading to sort makes it easy to find.",
            "Right after copying a big folder, simply waiting until indexing finishes can improve things. Leave it for 30 minutes to an hour and check again.",
            "If it stays high after that, write down the disk usage and the program name at that time.",
          ],
        },
        LIMIT("If it repeats or a storage error is suspected, a data backup and a check are needed, so it is safer to hand it over. Ask before you format or reinstall."),
      ],
      guides: [],
    },
    r_taskbar: {
      mode: "remote",
      title: "A frozen taskbar or Start menu: restart Explorer and check recent installs first",
      lead: "When only the Start menu or the notification area freezes, it is often the Explorer shell losing its response while drawing the bottom of the screen, so check the shell setup before the whole of Windows.",
      steps: [
        {
          t: "Restart only Explorer",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc to open Task Manager. If it opens small, click \"More details\" at the bottom left.",
            "On the \"Processes\" tab, find \"Windows Explorer\", right-click it and choose \"Restart\". If you cannot find it, type \"Explorer\" in the search box at the top.",
            "While it restarts, the taskbar and any open Explorer windows disappear for a moment and then come back. This is normal.",
            "If \"Windows Explorer\" is not in the process list, or the taskbar has disappeared completely, click \"Run new task\" at the top of Task Manager, type explorer.exe in the Open box and click OK.",
            "Repeat the action that was freezing (opening a folder, clicking the Start menu and so on) and check whether it frees up right away. If it does, the cause is more likely something attached to Explorer (a shell extension) or a list than the files themselves.",
          ],
        },
        {
          t: "Check recently installed customization or Start menu tools",
          tools: [],
          how: [
            "Open Settings (Win+I) > Apps > Installed apps and sort by install date.",
            "Look for recently installed tools that customize the taskbar or Start menu, compression programs and right-click menu tools.",
            "Remove just one suspect (three dots on the right → \"Uninstall\"), restart and check whether the symptom changes.",
            "If you remove several at once you cannot tell which was the cause, so compare one at a time.",
            "If it started right after an update, check the date in Settings > Windows Update > Update history.",
          ],
        },
        {
          t: "Test with a new user account to tell whether it is your own account",
          tools: [],
          how: [
            "Open Settings (Win+I) > Accounts > Other users (or Family & other users).",
            "Use \"Add account\" to create a local test account.",
            "Sign out of your current account, sign in to the new one and check whether the Start menu and the notification area on the right work normally.",
            "If it is normal in the new account, the Start menu settings or profile data of your own account are likely corrupted. If it freezes the same way in the new account too, suspect a system component or an installed program that has nothing to do with the account.",
            "When the test is over you can delete the account you created from the same screen.",
          ],
        },
        {
          t: "Check whether the display scaling differs between monitors",
          tools: [],
          how: [
            "If you use two or more monitors, open Settings (Win+I) > System > Display.",
            "Select each monitor at the top in turn and check its \"Scale\" value.",
            "If the scaling differs between monitors, set them to the same value, restart and see whether the symptom changes.",
            "If you cannot make them match, connect only one monitor and compare whether the same symptom appears.",
          ],
        },
        LIMIT("If the same symptom appears in a new account too, or even the Ctrl+Alt+Del screen does not appear, it may be a system problem, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_click: {
      mode: "remote",
      title: "If the mouse moves but clicking does nothing, first find out how much is still alive",
      lead: "Even if the pointer moves, you cannot assume it is the mouse. Work through which of Explorer, the graphics driver, the disk or a program froze, in order.",
      warn: "Repeating a forced shutdown with the power button while frozen can corrupt files. Save what you can, then shut down once.",
      steps: [
        {
          t: "Tell whether Task Manager and the Ctrl+Alt+Del screen open",
          tools: [],
          how: [
            "When the mouse pointer moves but clicking does nothing, first press Ctrl+Shift+Esc and see whether Task Manager opens.",
            "If it does not open, press Ctrl+Alt+Del and see whether the blue menu screen appears. If it does, choose \"Task Manager\" on that screen or click \"Sign out\" and sign in again.",
            "If Task Manager opens, you can narrow it down to Explorer, a specific program or the disk rather than the whole of Windows. While it is open, note the disk usage and any app marked \"Not responding\".",
            "If even the Ctrl+Alt+Del screen does not appear, it is not a taskbar problem but a freeze of the whole system. In that case save what you can, shut down with the power button once, and write down the time it froze.",
            "Do not repeat forced shutdowns with the power button; after rebooting, check the Event Viewer records.",
          ],
        },
        {
          t: "Restart only Explorer",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc to open Task Manager. If it opens small, click \"More details\" at the bottom left.",
            "On the \"Processes\" tab, find \"Windows Explorer\", right-click it and choose \"Restart\". If you cannot find it, type \"Explorer\" in the search box at the top.",
            "While it restarts, the taskbar and any open Explorer windows disappear for a moment and then come back. This is normal.",
            "If \"Windows Explorer\" is not in the process list, or the taskbar has disappeared completely, click \"Run new task\" at the top of Task Manager, type explorer.exe in the Open box and click OK.",
            "Repeat the action that was freezing (opening a folder, clicking the Start menu and so on) and check whether it frees up right away. If it does, the cause is more likely something attached to Explorer (a shell extension) or a list than the files themselves.",
          ],
        },
        {
          t: "Try resetting the graphics driver (Win+Ctrl+Shift+B)",
          tools: [],
          how: [
            "While the screen is frozen but the mouse pointer still moves, press Win+Ctrl+Shift+B at the same time.",
            "If the screen flickers for a moment or you hear a short beep and it recovers, the graphics driver stopped and was restarted.",
            "If it recovers, compare with game overlays (Discord, GeForce Experience, Xbox Game Bar and so on) turned off, and check the GPU temperature and the auxiliary power connection.",
            "If this key combination does not bring it back, move on to the next step.",
          ],
        },
        {
          t: "Turn off recently installed sync, antivirus and overlay programs one at a time and compare",
          tools: [],
          how: [
            "Think of the cloud sync programs (other than OneDrive), antivirus programs and game overlays you installed recently and list them.",
            "In the notification area icons on the taskbar, right-click the program and choose \"Exit\".",
            "Exit just one and work as before for a few minutes to see whether the click freeze disappears.",
            "If you change several at once you cannot compare, so go one by one.",
            "If a program looks like the cause, note its name and version, and update it or contact that program's support.",
          ],
        },
        {
          t: "Note the time it froze and compare the Event Viewer for the same time",
          tools: [],
          how: [
            "Write down the time of the symptom to the minute.",
            "Type \"Event Viewer\" in the Start menu search and open it.",
            "On the left, open Windows Logs > Application and see whether Application Hang 1002 (the program that stopped responding) and Application Error 1000 (the faulting module) are there at that time.",
            "Move to Windows Logs > System and check whether Disk, Ntfs, Display, WHEA-Logger and Kernel-Power records repeat around the same time.",
            "Do not blame a part from a single error; give the repeated records at that time and the actual symptom together when you ask for help.",
          ],
        },
        LIMIT("If Disk errors or WHEA records repeat, a backup comes first, and checking the parts is safer to hand over."),
      ],
      guides: [],
    },
    r_browser: {
      mode: "remote",
      title: "If only the browser freezes, check extensions and graphics acceleration first",
      lead: "A browser not responding is more often the browser getting stuck on memory or scripts than a Windows fault. Look at tabs, extensions and graphics acceleration separately.",
      steps: [
        {
          t: "Use the browser's own task manager (Shift+Esc) to see what is heavy",
          tools: [],
          how: [
            "With Chrome or Edge open, press Shift+Esc. The browser's own task manager opens.",
            "Look at the memory and CPU usage of each tab and extension. Click a column heading to sort from highest.",
            "If one tab or extension keeps using a lot, select it and click \"End process\".",
            "Open the same site again and see whether it happens again. If it keeps happening on only one site, clear only that site's cookies and site data.",
            "If it freezes in a similar way on several sites, the order is to suspect extensions or hardware acceleration.",
          ],
        },
        {
          t: "Turn off all extensions, then turn them on one at a time",
          tools: [],
          how: [
            "Type chrome://extensions in the address bar for Chrome, or edge://extensions for Edge, to open the extension list.",
            "Click the switch at the right of each extension to turn them all off.",
            "Close the browser completely and open it again to see whether the freezing disappears.",
            "If the freezing disappears, turn the extensions back on one at a time and find which one makes it freeze again.",
            "Remove or replace the extension that looks like the cause.",
          ],
        },
        {
          t: "Turn off hardware acceleration in the browser and clear the cache",
          tools: [],
          how: [
            "Chrome: turn off \"Use graphics acceleration when available\" in Settings > System. Edge: turn off the similarly named \"graphics acceleration\" option in Settings > System and performance.",
            "To apply the change, click \"Relaunch\" or close the browser completely and open it again.",
            "Press Ctrl+Shift+Delete, choose \"Cached images and files\" and delete them. Clearing cookies as well can sign you out, so choose it only when needed.",
            "Check whether the freezing is gone in the same action. If turning it off helped, the graphics driver may be old or unstable, so update it to the maker's latest driver and turn acceleration back on to compare.",
            "Turning off hardware acceleration usually makes little noticeable difference in performance.",
          ],
        },
        LIMIT("If other programs freeze together with the browser, the cause may be different, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_disk: {
      mode: "remote",
      title: "If disk usage is high, look at what is using it and the condition of the storage device",
      lead: "If the disk stays close to 100%, it is often a temporary task such as updates or search indexing, a shortage of storage space, or an aging storage device.",
      steps: [S.taskmgr, S.storageFree, S.smart, S.malware, LIMIT("If the storage device is in poor condition, you need a data backup and a replacement, so it is safer to hand it over. If there is important data, ask before you replace it.")],
      guides: [{ href: "/en/ssd-health-check.html", t: "SSD health check tool" }],
    },
    r_cpu: {
      mode: "remote",
      title: "If the CPU stays high, first tell which program it is",
      lead: "If the CPU stays high, the candidates are a particular program or background task, malware, or reduced performance caused by overheating.",
      steps: [S.taskmgr, S.safeMode, S.malware, S.temp, S.dust],
    },
    r_mem: {
      mode: "remote",
      title: "If the memory is full, cut down the programs using it and check the capacity",
      lead: "If the memory stays full, it is background programs, browser tabs and extensions, or the memory capacity itself being too small.",
      steps: [
        S.taskmgr,
        S.startup,
        {
          t: "Clean up browser tabs and extensions",
          tools: [],
          how: [
            "Close the tabs you have left open for a long time in Chrome or Edge. Tabs you need can be saved as bookmarks so you can close them.",
            "On the \"Processes\" tab of Task Manager (Ctrl+Shift+Esc), see how much memory the browser uses.",
            "Open \"Extensions\" in the browser menu (the three dots at the top right) and turn off or remove the ones you do not use.",
            "Close the browser completely and open it again, and check whether the memory use has dropped.",
            "In Chrome you can turn on \"Memory Saver\" in Settings > Performance.",
          ],
        },
        {
          t: "Check your PC's memory capacity and whether it can be upgraded",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > About.",
            "In the \"Device specifications\" area, check the \"Installed RAM\" amount.",
            "While you do your usual work (several browser tabs, games and so on), if Task Manager's \"Performance\" → \"Memory\" stays full, the capacity may be too small.",
            "On the support page of the PC or motherboard maker, check the memory type your PC takes and how to upgrade it.",
            "Give the results (the installed RAM amount and the share of memory in use) when you ask for help.",
          ],
        },
        LIMIT("If it is hard to upgrade the memory yourself, it is safer to have the type checked and the memory installed by a professional."),
      ],
    },
    r_slowgen: {
      mode: "remote",
      title: "For slowness with no obvious item, do the basic checks in order",
      lead: "If no item in Task Manager is clearly high, start with the basic items such as the startup programs, the power mode, the storage space and malware.",
      steps: [S.fullRestart, S.startup, S.powerMode, S.storageFree, S.malware, S.smart],
    },
    r_startup: {
      mode: "remote",
      title: "If booting is slow, look first at the startup programs and the storage device",
      lead: "Common causes of slow booting are many startup programs, a slow storage device (especially an HDD), or a program installed recently.",
      steps: [
        S.startup,
        {
          t: "Check the Fast startup setting",
          tools: [],
          how: [
            "Type \"Control Panel\" in the Start menu search and open it.",
            "Open \"Hardware and Sound\" > \"Power Options\". Click \"Choose what the power buttons do\" on the left.",
            "Click \"Change settings that are currently unavailable\" (click \"Yes\" if administrator permission is needed).",
            "Under \"Shutdown settings\", check whether \"Turn on fast startup (recommended)\" is ticked.",
            "Change the tick, click \"Save changes\", restart and compare whether the boot time changes. Depending on the symptom, turning it on may be better, or turning it off.",
          ],
        },
        S.smart,
        {
          t: "Check the programs installed recently",
          tools: [],
          how: [
            "Open Settings (Win+I) > Apps > Installed apps.",
            "Change the sort order to \"Install date\". Find the programs installed around the time it started to get slow.",
            "Remove the ones installed around that time that you do not need. Click the three dots at the right → \"Uninstall\".",
            "Do not delete security or update related programs casually.",
            "Restart and check whether the boot time or the speed you feel has changed.",
          ],
        },
      ],
    },
    r_fan: {
      mode: "visit",
      title: "If the fan gets loud, check the temperature and the dust first",
      lead: "A fan that suddenly gets louder is usually spinning faster because the temperature has risen, or because of piled-up dust or a worn fan bearing.",
      steps: [
        S.temp,
        S.dust,
        {
          t: "Check the fan control settings in the BIOS",
          tools: [],
          how: [
            "Switch the PC fully off. As soon as you switch it on, keep pressing the Del key (or F2) two or three times a second to enter the BIOS. The key differs by manufacturer and is shown at the bottom of the screen at start-up.",
            "Look for menus such as \"Monitor\", \"Hardware Monitor\", \"Fan Control\" and \"Smart Fan\". On some boards you have to switch to \"Advanced Mode (F7)\" to see them.",
            "Check that the fan speed setting (Silent, Standard, Performance and so on) has not changed from what it normally is.",
            "If you changed a setting, save with F10 and exit. If you are not sure, do not change anything; leave with Esc without saving.",
            "It is safer to only look inside the BIOS and then leave.",
          ],
        },
        {
          t: "Check for programs putting a load on it in the background",
          tools: [],
          how: [
            "Open Task Manager with Ctrl+Shift+Esc and look at the \"Processes\" tab.",
            "Click the CPU and GPU columns to sort from the highest use.",
            "If a program you are not using has a high load, right-click it and end it with \"End task\". Do not end Windows' own processes (System, Service Host and so on) casually.",
            "For a program that keeps a high load, turn off its automatic start in Settings > Apps > Startup.",
            "Compare how much the fan spins when there is no load.",
          ],
        },
        LIMIT("If the fan makes a grinding noise, the bearing may be worn, and replacing the fan or checking the cooler is safer to hand over."),
      ],
    },
    r_heat: {
      mode: "visit",
      title: "If it gets hot and shuts off, check the temperature and the cooling state",
      lead: "For a PC that shuts off from overheating, common causes are dust, a stopped fan, and poor ventilation where it is set up. Watch the temperature to tell which part is hot.",
      warn: "If there is a smell of burning, or part of the PC is too hot to touch, switch the power off and ask for help.",
      steps: [
        S.temp,
        S.dust,
        {
          t: "Check that the fans really spin, and the setup environment",
          tools: [],
          how: [
            "With the PC on, check by eye and ear that the CPU cooler, the graphics card fans and the case fans are all spinning. If the side panel is transparent, you can see the fans turning.",
            "Check that the PC or laptop is not in a place where the vents are blocked, such as against a wall, on bedding or under a desk.",
            "Use a laptop on a hard flat surface and do not block the vents underneath. On a bed or on your lap, the vents are blocked and the temperature rises.",
            "Leave at least 10 cm around the PC and do the same task to see whether the temperature changes.",
            "If a fan does not spin or only one fan spins, note which fan does not spin.",
          ],
        },
        LIMIT("If it is still hot, reapplying thermal paste or replacing the cooler may be needed, and a check that needs taking it apart is safer to hand over."),
      ],
    },
    r_hddnoise: {
      mode: "visit",
      title: "For hard drive noise, protecting your data comes first",
      lead: "A regular clicking or scraping sound can be a sign of a failing hard drive. Protecting your data comes before finding the cause.",
      warn: "If a regular clicking sound repeats, the longer you keep using it the more the data can be damaged, so switch the power off and ask for help.",
      steps: [
        {
          t: "Tell what kind of sound it is",
          tools: [],
          how: [
            "While the sound is happening, listen closely and tell what kind of sound it is.",
            "A steady \"whoosh\" of air or a rotating sound can be the fan and may be normal.",
            "A regular \"click-click\", or a scraping \"grr\" that appears only when you use it, can be a warning sign from something like a hard drive.",
            "Remember when the sound happens (just after boot, while copying files, all the time) and its pitch.",
            "Put your ear close to the computer to gauge where the sound comes from (near the hard drive, at the fan and so on). Be careful that your hand or a tool does not touch the fan.",
          ],
        },
        {
          t: "Back up your important data to another place first",
          tools: ["An external storage device to back up to (an external hard drive or SSD, or a large USB stick)"],
          how: [
            "First decide the list of the really important data (photos, documents, work files).",
            "Connect an external storage device (an external hard drive or SSD, or a large USB stick), or get ready to copy to another PC.",
            "Copy the most important data first, one item at a time. Do not copy a large folder all at once; split it up in order of priority.",
            "If the sound gets worse or it stops during copying, stop and do not try further. Forcing it again and again can make the condition worse.",
            "If many files will not copy, press \"I need help\" to go on to the next step.",
          ],
        },
        S.smart,
        {
          t: "Check the hard drive's fixing screws and vibration",
          tools: [DRV],
          needs: OPEN_DESKTOP,
          how: [
            SAFE_OFF,
            "Open the side panel and check that the hard drive is firmly fixed to the case bracket (the disk cradle) with screws.",
            "Press lightly to see whether loose rubber vibration pads or a loose bracket make a resonating sound with the case.",
            "If a screw is loose, tighten it with a Phillips screwdriver. Do not tighten it too hard.",
            "Close the side panel, connect the power cord, switch on again and check whether the sound has changed.",
          ],
        },
        LIMIT("If data recovery is needed or the noise continues, a professional check is needed. Ask before you format or reinstall."),
      ],
    },
    r_coil: {
      mode: "visit",
      title: "For graphics card high-pitched noise, see whether it is related to the load and the frame rate",
      lead: "A buzzing or whining sound sometimes comes from a part of the graphics card (the coil) and can change with the frame rate or the load. It is not always a fault.",
      steps: [
        {
          t: "Check whether the sound changes with the load and the frame rate",
          tools: [],
          how: [
            "Run a game or a benchmark and see whether the sound differs when the frame rate is high and when it is low.",
            "Check whether the sound gets worse on a screen where the frame rate is very high (hundreds of FPS), such as a menu screen.",
            "Note whether it is quiet on the desktop, or happens only on certain screens.",
            "Make a note of whether the sound gets louder with the load or higher with the frame rate.",
            "This note is used in the next step (limiting the frame rate) and when you ask for help.",
          ],
        },
        {
          t: "Set a frame rate cap and test whether the sound decreases",
          tools: [],
          how: [
            "In the game settings, turn on \"V-Sync\" or set the maximum frame rate limit to about the monitor's refresh rate (for example 60 or 144).",
            "You can also limit the maximum frame rate in a graphics program such as the NVIDIA Control Panel > Manage 3D settings, or AMD Software.",
            "Listen to the sound again on the same screen.",
            "If the sound drops after limiting it, it is likely noise that appears when the frame rate is very high. This is a general check and not confirmed.",
            "When the test is over, put it back to the original setting if you want.",
          ],
        },
        {
          t: "Check whether the sound comes from the graphics card",
          tools: [DRV],
          needs: OPEN_DESKTOP,
          how: [
            "With the game running, open the side panel. Be careful that your hand or a tool does not touch a fan.",
            "Put your ear close and check whether the sound comes from the graphics card side.",
            "Tell whether it is not the sound of a case fan or the power supply, and not the sound of the case resonating.",
            "If a \"sizzling\" sound (coil noise) from the graphics card changes together with the load, it may be noise from the graphics card. It is not confirmed.",
            "When you have finished checking, quit the game and close the side panel.",
          ],
        },
        LIMIT("If the noise is severe or bothers you, whether the graphics card can be exchanged or checked depends on the policy of the shop where you bought it, so ask them."),
      ],
    },
    r_fps: {
      mode: "remote",
      title: "For game frame rate drops, separate the driver, the power mode, the temperature and the settings",
      lead: "If the frame rate drops only in a particular game, check in order the graphics driver, the power mode, reduced performance from temperature, background programs and the game settings.",
      steps: [
        S.powerMode,
        {
          t: "Update the graphics driver to the latest",
          tools: [],
          how: [
            "From the graphics card maker's site (NVIDIA, AMD or Intel), download the latest driver for your model. For a laptop, we recommend the driver on the laptop maker's site first.",
            "Install it following the installer's instructions. It is normal for the screen to go dark for a moment during installation.",
            "When the installation finishes, restart.",
            "Run the same game again and check whether the symptom has changed.",
          ],
        },
        S.temp,
        {
          t: "Check that the monitor cable is plugged into the graphics card port",
          tools: [],
          how: [
            "Look at the back of the PC. The lower area where several ports are gathered side by side (a plate fitted vertically) is the graphics card, and the upper part (near the USB and LAN ports) is the motherboard.",
            "Check that the monitor cable is plugged into a port on the lower graphics card. If it is plugged into a motherboard port, the game runs on the built-in graphics and can be very slow.",
            "If it was in a motherboard port, switch the PC off and move it to the graphics card port. Also set the monitor's input source to match.",
            "After moving it, check whether the frame rate has changed in the same game.",
            "If your PC has no separate graphics card, skip this step.",
          ],
        },
        {
          t: "Turn off background programs and overlays, and lower the game settings",
          tools: [],
          how: [
            "Open Task Manager (Ctrl+Shift+Esc) and look for programs that use a lot of CPU or disk during the game. End the ones you do not need.",
            "Turn off overlay features such as Discord, GeForce Experience and the Xbox Game Bar (opened with Win+G) and test again.",
            "Lower the in-game graphics settings (resolution, shadows, anti-aliasing and so on) one step at a time and see whether the frame rate changes.",
            "Change only one thing at a time so you can tell which setting affects the frame rate.",
            "If it is still slow, the problem may be the graphics driver or the hardware, so go on to the next step.",
          ],
        },
      ],
    },
  };

  window.ITSVC_WIZARD = { nodes: NODES };

  // Per-step notes (c: cause candidate, m: rough time, l: difficulty, w: why, r: how to read the result, t: site tool key).
  // The time is a rough estimate based on the kind of task, not a measurement.
  window.ITSVC_WIZARD_META = Object.assign(window.ITSVC_WIZARD_META || {}, {
    "Restart only Explorer": {"c": "Explorer (shell) not responding", "m": "About 3 min", "l": "Easy", "w": "Restarting only Explorer often clears the freeze without rebooting the whole computer.", "r": "If it frees up right away → the cause is more likely something attached to Explorer, or a list."},
    "Disconnect external drives and network drives, then compare": {"c": "A slow storage device or a broken network location", "m": "About 10 min", "l": "Easy", "w": "When you open \"This PC\", Explorer reads the state of every connected drive. One slow drive can make the whole thing look frozen.", "r": "If the freezing disappears with them removed → that device or network location is the cause."},
    "Remove broken paths pinned in Quick access": {"c": "Quick access and recent items pointing at broken paths", "m": "About 5 min", "l": "Easy", "w": "When Explorer starts, it checks the state of the items in the Quick access list. If one of them cannot be reached, that waiting time looks like a freeze.", "r": "If the freezing lessens after removing them → the list was the cause, not the files."},
    "Check whether the search indexer is using the disk": {"c": "The search indexer using the disk", "m": "About 5 min", "l": "Easy", "w": "While a large number of files are being indexed, disk reads pile up and Explorer can slow down.", "r": "If the indexer is high and then drops after a while → it was a temporary indexing job."},
    "Check recently installed customization or Start menu tools": {"c": "A program conflicting with the Start menu or shell", "m": "About 10 min", "l": "Easy", "w": "The Start menu and taskbar run together with Explorer, so a tool that changes that area is often a clue to the freeze.", "r": "If the symptom disappears after removing one → that program is the cause."},
    "Test with a new user account to tell whether it is your own account": {"c": "Corrupted profile or Start menu settings in your account", "m": "About 15 min", "l": "Moderate", "w": "A new account starts with clean settings, so comparing whether the same symptom appears tells you whether it is the account or the system.", "r": "If it is normal in the new account → the problem is on your own account's side."},
    "Check whether the display scaling differs between monitors": {"c": "Taskbar freezing caused by different scaling on multiple monitors", "m": "About 5 min", "l": "Easy", "w": "With monitors of different scaling mixed together, the taskbar is redrawn per monitor and freezing is reported more often.", "r": "If it gets better once they match → the scaling difference is a suspected cause."},
    "Tell whether Task Manager and the Ctrl+Alt+Del screen open": {"c": "Telling a full freeze from Explorer alone freezing", "m": "About 5 min", "l": "Easy", "w": "What you suspect depends on how much is still alive. If Task Manager opens, the range narrows.", "r": "If Task Manager opens → it is not a full freeze; it narrows to Explorer, a program or the disk."},
    "Try resetting the graphics driver (Win+Ctrl+Shift+B)": {"c": "The graphics driver stopped", "m": "About 3 min", "l": "Easy", "w": "This restarts only the graphics driver, for when it feels like the screen just stopped updating.", "r": "If it recovers after the keys → suspect the graphics driver, overlays or temperature."},
    "Note the time it froze and compare the Event Viewer for the same time": {"c": "System records at the time of the freeze", "m": "About 10 min", "l": "Moderate", "w": "Even if a reboot makes the freeze go away, the cause remains. Keeping the records from the time it froze narrows the candidates.", "r": "If Disk errors repeat → the storage device comes first. Back up important files first."},
    "Turn off recently installed sync, antivirus and overlay programs one at a time and compare": {"c": "A background program conflicting", "m": "About 15 min", "l": "Moderate", "w": "Sync, antivirus and overlay programs can get in the way of the input path, so turning them off one at a time finds the culprit.", "r": "If the freeze disappears after exiting one → that program is the cause."},
    "Use the browser's own task manager (Shift+Esc) to see what is heavy": {"c": "A specific tab or extension hogging resources", "m": "About 5 min", "l": "Easy", "w": "Inside the browser it shows right away which tab or extension is the culprit.", "r": "If only one item is high → that item, not the whole browser, is the cause."},
    "Turn off all extensions, then turn them on one at a time": {"c": "An extension conflicting", "m": "About 10 min", "l": "Easy", "w": "Extension conflicts are a common cause of a browser not responding, so turn them all off and narrow it down one at a time.", "r": "If the freezing disappears with them all off → one of the extensions is the cause."},
    "Turn off hardware acceleration in the browser and clear the cache": {"c": "Browser graphics acceleration or cache problem", "m": "About 10 min", "l": "Easy", "w": "If graphics acceleration does not match the driver, or the cache is corrupted, the browser can freeze while drawing.", "r": "If the freezing disappears after turning it off → go on to update the graphics driver."},
    "Check what is using the most in Task Manager": { c: null, m: "About 5 min", l: "Easy", w: "If you do not know whether the slowness is the CPU, the memory or the disk, it is hard to act. Seeing what is maxed out is the first step.", r: "If only one item stays high → dig into that item." },
    "Check that you are not short of storage space, and clean it up": { c: "Short of storage space", m: "About 15 min", l: "Easy", w: "When the C: drive is nearly full, Windows slows down and updates also fail. Free space matters.", r: "If space frees up and it gets faster → the shortage of space was the cause." },
    "Check the storage device's health (SMART)": { c: "Worn-out or failing storage device", m: "About 10 min", l: "Easy", w: "This is health information the storage device records about itself. It shows whether slowness is due to the disk wearing out.", r: "If it says \"Caution\" or \"Bad\", or there are pending sectors → the disk is worn. Back up your data first.", t: "ssd" },
    "Run a full scan with Windows Security": { c: "Malware", m: "30+ min", l: "Easy", w: "This rules out malicious software secretly using the CPU or disk. It takes a long time but it is a cause that is easy to miss.", r: "If a threat is found → remove it and check again." },
    "Check whether it is still slow in Safe Mode": { c: null, m: "About 15 min", l: "Moderate", w: "If it is slow in Safe Mode too, the hardware or Windows itself is the cause; if it is fast, a program that normally runs is the cause.", r: "If it is fast in Safe Mode → it is a startup program or installed program problem." },
    "Check the temperature": { c: "Overheating", m: "About 10 min", l: "Easy", w: "When it is hot, the computer lowers its own performance and gets slow. The temperature tells you whether it is a cooling problem.", r: "If a high temperature lasts for long → suspect the cooling (dust, fans)." },
    "Remove dust from inside the PC": { c: "Dust, reduced cooling", m: "About 20 min", l: "Moderate", w: "Dust is the most common cause of trapped heat. Cleaning alone can greatly reduce the temperature and the noise.", r: "If the temperature and noise drop after cleaning → dust was the cause." },
    "Reduce the startup programs": { c: "Too many startup programs", m: "About 10 min", l: "Easy", w: "The more programs that run along with switching the computer on, the longer booting takes. You can turn off the ones you do not need.", r: "If booting gets faster after reducing them → startup programs were the cause." },
    "Clean up browser tabs and extensions": { c: "Too many browser tabs or extensions", m: "About 5 min", l: "Easy", w: "Browser tabs and extensions use more memory than you might think. Cleaning them up alone can make it noticeably faster.", r: "If the memory drops after closing tabs → the browser was the cause." },
    "Check your PC's memory capacity and whether it can be upgraded": { c: "Not enough memory", m: "About 5 min", l: "Easy", w: "If the memory is too small for the work you do, it stays slow. This step is to check how much you have now.", r: "If the capacity is small for the work and always full → consider upgrading the memory." },
    "Do a full restart": { c: "Temporary load from being left on for a long time", m: "About 5 min", l: "Easy", w: "A computer left on for a long time can get slow from built-up leftovers. \"Restart\" resets the state cleanly.", r: "If it gets faster after restarting → it was a temporary load." },
    "Check the power mode": { c: "Power saving power mode", m: "About 3 min", l: "Easy", w: "Power saving mode lowers the performance on purpose. Changing to Balanced or Best performance can change how it feels.", r: "If it gets faster after changing the mode → the power saving setting was the cause." },
    "Check the Fast startup setting": { c: "Fast startup setting", m: "About 10 min", l: "Easy", w: "Fast startup is a feature that keeps some state to make booting quicker. Turn it on and off and compare which is better.", r: "If it changes after you change the setting → Fast startup had an effect." },
    "Check the programs installed recently": { c: "Recently installed programs", m: "About 10 min", l: "Easy", w: "Programs installed around the time it started to get slow are often the cause. Looking in order of install date makes them easy to find.", r: "If it gets faster after deleting → that program was the cause." },
    "Check the fan control settings in the BIOS": { c: "Fan control settings", m: "About 10 min", l: "Moderate", w: "The fan speed is decided in the BIOS. If a setting changes, the fan can suddenly get noisy.", r: "If it gets quiet after returning the setting to its usual value → the fan control setting was the cause." },
    "Check for programs putting a load on it in the background": { c: "Load from background programs", m: "About 5 min", l: "Easy", w: "If a program is using the CPU or GPU out of sight, the fan keeps spinning. You can find it with Task Manager.", r: "If a particular program is putting a load on it → end it or turn it off in the startup programs." },
    "Check that the fans really spin, and the setup environment": { c: "Stopped fan, poor ventilation", m: "About 10 min", l: "Easy", w: "If a fan has stopped or the vents are blocked, it gets hot quickly. It is the easiest check, done with your eyes and ears.", r: "If a fan does not spin or the ventilation is blocked → that is the cause of the overheating." },
    "Tell what kind of sound it is": { c: null, m: "About 3 min", l: "Easy", w: "Depending on its kind, a hard drive sound can be normal noise or a sign of failure. First tell which sound it is.", r: "If it is a regular clicking or scraping sound → it may be a sign of failure." },
    "Back up your important data to another place first": { c: null, m: "30+ min", l: "Easy", w: "When a disk is a worry, protecting the data comes before finding the cause. The condition can get worse as time goes on.", r: "If copying is blocked or the sound gets worse → stop and get a professional check." },
    "Check the hard drive's fixing screws and vibration": { c: "Fixing screws, vibration resonance", m: "About 15 min", l: "Moderate", w: "Sometimes the disk sound is really the sound of the disk vibrating together with the case. Tightening the screws alone can make it disappear.", r: "If the sound drops after fixing it → vibration resonance was the cause." },
    "Check whether the sound changes with the load and the frame rate": { c: null, m: "About 10 min", l: "Easy", w: "Coil noise often changes when the graphics card is working. Knowing when it gets worse lets you guess the cause.", r: "If the sound changes with the frame rate → coil noise is likely." },
    "Set a frame rate cap and test whether the sound decreases": { c: "Coil noise at a high frame rate", m: "About 10 min", l: "Easy", w: "Limiting the frame rate means the graphics card works less hard, and the sound sometimes drops.", r: "If the sound drops with a cap → it is noise that appears at a high frame rate." },
    "Check whether the sound comes from the graphics card": { c: null, m: "About 10 min", l: "Moderate", w: "This tells whether the sound comes from the power supply or a case fan instead. Pointing at the wrong part is wasted effort.", r: "If it is confirmed to come from the graphics card → it may be coil noise." },
    "Update the graphics driver to the latest": { c: "Graphics driver problem", m: "About 15 min", l: "Moderate", w: "Game frame rate problems are often due to an out-of-date driver. Updating to the latest sometimes improves it.", r: "If the frame rate improves after updating → it was a driver problem." },
    "Check that the monitor cable is plugged into the graphics card port": { c: "Plugged into the motherboard port (using built-in graphics)", m: "About 3 min", l: "Easy", w: "If it is plugged into a motherboard port, the game runs on the built-in graphics and gets very slow. It is a common mistake.", r: "If it gets faster after moving the port → it was where it was plugged in." },
    "Turn off background programs and overlays, and lower the game settings": { c: "Overlays, game settings", m: "About 10 min", l: "Easy", w: "Chat and recording overlays or programs running behind the game cut its performance. Turn them off and lower the settings to compare.", r: "If the frame rate goes up after turning them off → that program was the cause." },
  });
})();
