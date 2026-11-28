(() => {
  // English edition of the Windows and programs self-check (wizard-software.js). Behavior lives in symptom-wizard.js,
  // screen text in wizard-ui-en.js. A faithful translation of the Korean wizard: no new claims. Windows menu names are
  // the English Windows 11 names. Korea-only items (KakaoTalk PC, Korean public certificates, the Korean carriers' dual-phone mode)
  // are left out, and links to Korean-only guides are not shown. Windows commands (sfc, DISM, slmgr, PowerShell and so on) have not been run in this environment; they follow the official tools' guidance.
  const LIMIT = (text) => ({ limit: true, t: text });

  // Steps shared by several results
  const S = {
    killProc: {
      t: "End the process completely, restart the PC and run it with normal rights",
      tools: [],
      how: [
        "Press Ctrl+Shift+Esc to open Task Manager. If it opens small, click \"More details\" at the bottom left.",
        "On the \"Processes\" tab, find the program's name, right-click it and choose \"End task\". If there are several with the same name, end them all.",
        "Restart the PC: Start button → Power → \"Restart\". A stuck background process or a pending update can block a new launch.",
        "After restarting, run the program the normal way (just double-click). Always running as administrator is not a fix; use it only as a temporary test to tell whether it is a permissions problem.",
        "See whether it opens or an error window appears, and write the error text down exactly.",
      ],
    },
    sfc: {
      t: "Run System File Checker (SFC) and DISM repair",
      tools: [],
      how: [
        "Type cmd in the Start menu search and click \"Run as administrator\".",
        "Type sfc /scannow and press Enter, then wait until the scan finishes. It can take a while, so do not close the window.",
        "If the result says \"found corrupt files but was unable to fix some of them\", type dism /online /cleanup-image /restorehealth and run it. The progress bar can look stuck and still be working.",
        "When DISM finishes, run sfc /scannow once more and check the result. DISM's \"The restore operation completed successfully\" only means it finished; it does not tell you whether anything was corrupt.",
        "Write down the result text exactly and give it to us when you ask for help.",
      ],
    },
    av: {
      t: "Run a full scan with Windows Security",
      tools: [],
      how: [
        "Type \"Windows Security\" in the Start menu search and open it.",
        "Click \"Virus & threat protection\".",
        "Click \"Scan options\", choose \"Full scan\" and click \"Scan now\".",
        "A full scan takes a long time (tens of minutes to a few hours depending on storage), so leave the PC on while you wait. You can do other work, but it may be slow.",
        "If a threat is found, remove or quarantine it as instructed.",
        "If you use another antivirus, run a full scan with that program.",
      ],
    },
    newacc: {
      t: "Test with a new user account to tell whether it is your own account",
      tools: [],
      how: [
        "Open Settings (Win+I) > Accounts > Other users (or Family & other users).",
        "Use \"Add account\" to create a local test account.",
        "Sign out of your current account, sign in to the new one and repeat the same action.",
        "If it is normal in the new account, the settings, cache or permissions of your own account are likely tangled. If it is the same in the new account too, suspect a system component or an installed program that has nothing to do with the account.",
        "When the test is over you can delete the account you created from the same screen.",
      ],
    },
    timesync: {
      t: "Set the date and time automatically",
      tools: [],
      how: [
        "Open Settings (Win+I) > Time & language > Date & time.",
        "Turn on \"Set time automatically\" and \"Set time zone automatically\".",
        "Click \"Sync now\" to set the clock. If the system time is far from the real time, certificate checks fail and the Store or sign-in can be blocked.",
        "Also check that the time zone is correct for where you are.",
        "After setting it, repeat the action that was failing.",
      ],
    },
    unblock: {
      t: "Check the \"Unblock\" mark on a downloaded file",
      tools: [],
      how: [
        "Right-click the file that will not open (an installer and so on) and open \"Properties\".",
        "On the \"General\" tab, look at the bottom for the \"This file came from another computer…\" text and the \"Unblock\" check box.",
        "Only tick \"Unblock\" and click \"Apply\" if it is an official file from a source you are sure about. If the source is unclear, do not tick it.",
        "For a compressed file, unblock the archive itself before extracting, so the files inside do not keep the mark.",
        "If the file is smaller than the size on the official download page, or you ran it directly from inside the archive, the download may have been cut off or not extracted, so download it again, extract it completely into a folder and run it.",
      ],
    },
    diskspace: {
      t: "Check that you are not short of storage space, and clean it up",
      tools: [],
      how: [
        "Open Settings (Win+I) > System > Storage.",
        "On the C: drive bar, check the free space and look at the usage by category (Apps, Temporary files, Documents and so on).",
        "Click \"Temporary files\", tick items that are safe to delete such as Downloads, the Recycle Bin and temporary files, and click \"Remove files\". Check the Downloads folder first for files you still need.",
        "Installs and updates sometimes need several times the original file size in temporary space, so leave free space of 2 to 3 times the installer size or more.",
        "After cleaning, check how much space you have freed.",
      ],
    },
    evt: {
      t: "Check the failure time and module with Event Viewer and the Reliability Monitor",
      tools: [],
      how: [
        "Run the program once to make it fail, and note the time to the minute.",
        "Press Win+R, type perfmon /rel and open Reliability Monitor. Click the \"Application error\" entry at that time and check the name of the faulting module.",
        "Or open Event Viewer from the Start menu search and, under Windows Logs > Application, open the \"Error\" entry from the same time.",
        "Check whether the faulting module is the program's own file, a runtime or graphics DLL such as vcruntime or d3d, or a driver. A program file points to repair or reinstall; a runtime DLL points to reinstalling that runtime.",
        "Give us the module name and the time when you ask for help.",
      ],
    },
  };

  const NODES = {
    start: {
      q: "What is the problem?",
      hint: "Pick the one symptom that is closest.",
      options: [
        { t: "A program won't open (or opens and closes right away)", icon: "grid", next: "appq" },
        { t: "A program installation fails or gets stuck partway", icon: "folder", next: "r_install" },
        { t: "A game won't launch (launcher or anti-cheat error)", icon: "gamepad", next: "r_gamelaunch" },
        { t: "Running a program shows error 0xc000007b or 0xc0000142", icon: "grid", next: "r_appinit" },
        { t: "\"The program can't start because MSVCP140.dll is missing\" appears", icon: "folder", next: "r_dll" },
        { t: "\"This app can't run on your PC\" appears", icon: "block", next: "r_apparch" },
        { t: "Running or installing a program shows \"Access is denied\" (0xc0000022 or 0x80070005)", icon: "lock", next: "r_perm" },
        { t: "A program closes with a \"0xc0000005 (access violation)\" error", icon: "grid", next: "r_av" },
        { t: "Windows Update keeps failing, or the Windows 11 upgrade won't install", icon: "loop", next: "updq" },
        { t: "Windows isn't activated, or I can't sign in to my Microsoft account", icon: "lock", next: "acctq" },
        { t: "The Microsoft Store won't open, or apps won't install from it", icon: "globe", next: "r_store" },
        { t: "Windows Search not working (no search results)", icon: "grid", next: "r_search" },
        { t: "Copy and paste isn't working", icon: "link", next: "r_clip" },
        { t: "Phone Link won't connect to my phone", icon: "globe", next: "r_phone" },
      ],
    },
    appq: {
      q: "Which programs won't open?",
      hint: "What to check depends on whether it is one program or several at once.",
      options: [
        { t: "Only one particular program won't open", next: "r_app1" },
        { t: "Several programs won't open at once (exe files, an image viewer, Task Manager and so on)", next: "r_appmulti" },
      ],
    },
    updq: {
      q: "What is the situation?",
      options: [
        { t: "The same Windows update keeps failing", next: "r_updloop" },
        { t: "The Windows 11 upgrade or the 24H2 update won't install", next: "r_upgrade" },
      ],
    },
    acctq: {
      q: "What is the problem?",
      options: [
        { t: "A Windows activation error (\"Windows isn't activated\")", next: "r_activation" },
        { t: "I can't sign in with my Microsoft account", next: "r_msaccount" },
      ],
    },
    r_app1: {
      mode: "remote",
      title: "If only one program won't open, start with its repair, components and block records",
      lead: "When only one program won't open, the cause is more often that program's settings, cache, required components or a security block than the whole of Windows. Leave resetting Windows or sweeping settings changes for later.",
      steps: [
        S.killProc,
        {
          t: "Write down the error text and compare with whether basic programs open",
          tools: [],
          how: [
            "Run the program, and if an error window appears, capture it or write the text down exactly. Include any error code such as 0x80070005.",
            "Press Ctrl+Shift+Esc to open Task Manager and see whether the process appears for a moment right after launch and then disappears.",
            "Check whether basic programs such as Notepad and Calculator open. If even they won't, go back to the question above and choose \"Several programs won't open at once\".",
            "If only that one program fails, the problem is with that program. Go on to the next step.",
          ],
        },
        {
          t: "Use \"Repair\" for the program in Installed apps",
          tools: [],
          how: [
            "Open Settings (Win+I) > Apps > Installed apps.",
            "Click the three dots at the right of the program → \"Advanced options\" (on some apps only \"Modify\" is shown).",
            "Click \"Repair\" first. Repair keeps your data, while \"Reset\" can erase app settings and sign-in information, so use Reset only if Repair does not work and after you have checked where your data is and how to recover the license.",
            "When the repair finishes, run the program again.",
          ],
        },
        S.evt,
        {
          t: "Check the security program's quarantine record and the required components",
          tools: [],
          how: [
            "Open Windows Security > Virus & threat protection > Protection history and see whether files of that program were quarantined or blocked. If you use another antivirus, check its records too.",
            "From the system requirements on the program maker's site, check the Visual C++ Redistributable, .NET runtime and graphics components it needs.",
            "If any are missing, download and install them from the official Microsoft site. Do not overwrite files from DLL download sites of unclear origin.",
            "Reinstall the program from the official installer, checking where your user data is and backing it up before you uninstall.",
          ],
        },
        S.newacc,
        LIMIT("If it is still the same after repair, reinstall and the new-account test, the system side needs checking, so it is safer to hand it over. Check where your data is before you uninstall or reset."),
      ],
      guides: [],
    },
    r_appmulti: {
      mode: "remote",
      title: "If several programs won't open, start with system files, malware and file associations",
      lead: "When exe files, an image viewer and even Task Manager fail together, the damage to the Windows shell, system files or the user profile may be wide. Start with a system file scan and an antivirus scan.",
      steps: [
        {
          t: "Tell apart file associations and where you run it from",
          tools: [],
          how: [
            "See whether the icon of an exe file has turned into a plain white page, or whether double-clicking opens an \"Open with\" window. If so, the file association is broken.",
            "Compare whether the same exe file opens from the desktop but fails only from the Downloads folder or an external drive. If it fails only in some locations, a block mark or a security restriction is more likely than the file association.",
            "If it fails wherever you run it, treat it as a system problem and start with the SFC and DISM repair below.",
            "Do not edit the registry by hand without finding the cause, and do not download a \"file association repair tool\" of unclear origin.",
          ],
        },
        S.sfc,
        S.av,
        S.unblock,
        {
          t: "Turn off recently installed startup programs for a while and compare",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc to open Task Manager and click the \"Startup apps\" tab.",
            "Right-click recently installed entries (especially tools that hook into the right-click menu or startup) and choose \"Disable\". Do not disable antivirus or driver entries.",
            "Restart the PC and compare whether the symptom changes.",
            "If it is normal, turn them back on one at a time and find which program makes it fail.",
          ],
        },
        S.newacc,
        LIMIT("If SFC, DISM and the antivirus scan do not fix it, profile repair or a reset may be needed, so it is safer to hand it over. A reset is a last resort; back up your data first."),
      ],
      guides: [],
    },
    r_appinit: {
      mode: "remote",
      title: "For 0xc000007b and 0xc0000142, check the runtimes, the graphics driver and permissions, in that order",
      lead: "0xc000007b appears when 32-bit and 64-bit components do not match, and 0xc0000142 appears when a program cannot finish the initialization it needs to start. Both are often a problem with the runtimes (Visual C++, DirectX, .NET), the graphics driver, or permissions and security software rather than the program itself, so check in this order before reinstalling.",
      steps: [
        {
          t: "Restart the PC and run the program as administrator",
          tools: [],
          how: [
            "Save your open work and restart the PC.",
            "Right-click the program icon and choose \"Run as administrator\" to start it again.",
            "If it is the same, go to the next step.",
          ],
        },
        {
          t: "Reinstall the Visual C++ redistributable and the DirectX runtime",
          tools: [],
          how: [
            "From Microsoft's official site, download and install the latest Visual C++ redistributable for both x86 and x64.",
            "Also reinstall the DirectX End-User Runtime from Microsoft's official site.",
            "First check in the program list of Control Panel whether a Visual C++ Redistributable is already there. Even if it is, it may be damaged, so reinstalling is better.",
            "Run the program again after the install.",
          ],
        },
        {
          t: "Repair .NET Framework, then remove the program completely and reinstall it",
          tools: [],
          how: [
            "Repair or reinstall .NET Framework.",
            "Remove the program completely and reinstall it with administrator rights.",
            "Check whether the program is 32-bit or 64-bit and reinstall the version that matches your system.",
            "Changing system folder permissions or running a registry cleaner is not recommended. Check the free space and the state of the services first.",
          ],
        },
        {
          t: "Update the graphics driver and check the effect of antivirus",
          tools: [],
          how: [
            "Download and install the latest driver from the graphics maker's site (NVIDIA, AMD or Intel).",
            "First check the antivirus block and quarantine records and its allow list. Only when truly needed, stop the protection briefly to run the program again, and turn it back on right after.",
            "A damaged user profile can also cause this, so create a new local account in Settings > Accounts > Family & other users, sign in and run the same program. If it works in the new account, it is a profile problem.",
          ],
        },
        LIMIT("If it is the same after reinstalling and checking the runtimes, system files or the profile may be damaged, so it is safer to ask for help. Before irreversible actions such as repair, reset or driver removal, back up your important files first."),
      ],
    },
    r_dll: {
      mode: "remote",
      title: "For a MSVCP140.dll error, reinstall the Visual C++ redistributable from the official site",
      lead: "MSVCP140.dll is a file inside the Visual C++ redistributable, which games and many programs require in common. If it is missing or damaged, the program cannot start.",
      warn: "Do not download the DLL file on its own from the internet and drop it in. A file from an unclear source is a security risk, and putting it in the wrong place can make things worse.",
      steps: [
        {
          t: "Install the Visual C++ redistributable again for both x86 and x64",
          tools: [],
          how: [
            "In Control Panel > Programs and Features, look for \"Microsoft Visual C++ Redistributable\" entries.",
            "If some exist, they may be damaged, so remove them first and install again cleanly.",
            "From Microsoft's official Visual C++ redistributable download page, download and install both x86 and x64. A 32-bit and a 64-bit program can require different versions.",
            "Run the program again after the install.",
          ],
        },
        {
          t: "Reinstall the program so that it installs its required components",
          tools: [],
          how: [
            "Uninstall the program in question.",
            "Install it again. Many programs install the components they need during setup.",
            "Run it again and check whether the error is gone.",
          ],
        },
        {
          t: "Check system files with sfc /scannow and see whether other programs show it too",
          tools: [],
          how: [
            "Right-click the Start button and open \"Terminal (Admin)\".",
            "Type sfc /scannow, press Enter and wait until it finishes.",
            "Note the result text (for example whether it found and repaired damaged files).",
            "Check whether other programs show the same error. If only one program does, it is that program's problem; if several do, the problem is system-wide.",
          ],
        },
        LIMIT("If it is the same after reinstalling the redistributable and running sfc, and it repeats in several programs, system files may be damaged, so it is safer to ask for help."),
      ],
    },
    r_apparch: {
      mode: "remote",
      title: "\"This app can't run on your PC\": check whether the app version matches your Windows setup",
      lead: "This appears when the app's architecture (32-bit or 64-bit) or the Windows version does not match this PC. Often an ARM app is run on an x64 PC, or an old app is not compatible with recent Windows, and sometimes SmartScreen or a group policy blocked it.",
      steps: [
        {
          t: "Compare the program's system requirements with your PC",
          tools: [],
          how: [
            "On the program's official website, check the required Windows version and whether it is 32-bit or 64-bit.",
            "Open Settings (Win+I) > System > About and check your Windows version and system type (such as 64-bit).",
            "If they do not match, download the installer that fits your PC.",
          ],
        },
        {
          t: "Download the installer again and check \"Unblock\"",
          tools: [],
          how: [
            "Download the installer again from the official site, check its integrity and reinstall. The download may have been damaged.",
            "Right-click the file that showed the message, open \"Properties\", and if there is an \"Unblock\" option, tick it and apply.",
            "SmartScreen warnings often appear for files that are unsigned or rarely downloaded. Continue with \"More info > Run\" only if you got it from a trustworthy source, and do not run it if the source is uncertain.",
          ],
        },
        {
          t: "Retry after Windows Update and check for work or school PC restrictions",
          tools: [],
          how: [
            "Install the latest updates in Settings > Windows Update and try again.",
            "For an old program, right-click the executable > \"Properties\" > \"Compatibility\" tab and try running it in compatibility mode. If it is a recent program, look at other causes first.",
            "On a work or school PC, the program may be restricted by group policy, so ask the administrator to register an exception.",
          ],
        },
        LIMIT("If it still does not work although the requirements match, the installer or the system may be at fault, so it is safer to ask for help."),
      ],
    },
    r_perm: {
      mode: "remote",
      title: "For access-denied errors, check administrator rights, folder permissions and security software, in that order",
      lead: "When 0xc0000022 appears while running a program, or 0x80070005 (the installer was denied access) appears while installing or removing one, the program could not get the permission it needs. Often it was run from a standard account, the folder permissions do not fit, or security software or a group policy blocked it.",
      steps: [
        {
          t: "Run as administrator and set it to always run as administrator",
          tools: [],
          how: [
            "Right-click the installer or the program, choose \"Run as administrator\" and try again.",
            "If it works as administrator, you can make it always run that way: shortcut > Properties > \"Compatibility\" tab > tick \"Run this program as an administrator\".",
          ],
        },
        {
          t: "Check the folder permissions and the User Account Control (UAC) setting",
          tools: [],
          how: [
            "Right-click the target folder (usually Program Files) or the folder holding the executable > \"Properties\" > \"Security\" tab and check that your account has permission.",
            "If you ever changed the UAC setting, set it back to the default and try again.",
            "Do not change system folder permissions carelessly. Check the free space and the state of the services first.",
          ],
        },
        {
          t: "Check the security software's block records and the group policy",
          tools: [],
          how: [
            "First confirm the installer or program came from an official source.",
            "Look at the security software's block and quarantine records and its allow list. Only when truly needed, stop the protection briefly to compare the install or run, and turn it back on right away.",
            "On a work or school PC, installing or running may be restricted by group policy, so ask the administrator to register an exception.",
            "If it still fails, reinstall the program to register its permission-related files again and check that required runtimes such as the Visual C++ redistributable are present.",
          ],
        },
        LIMIT("If it is the same after the permission checks, the account or a system policy may be at fault, so it is safer to ask for help."),
      ],
    },
    r_av: {
      mode: "remote",
      title: "For 0xc0000005, first tell whether it repeats only in one program, then check security software, DLL conflicts and RAM",
      lead: "This is an access violation error that appears when a program tries to reach a memory area it has no permission for. The main causes are a bug in the program itself, an incompatible driver or DLL, or unstable RAM, and sometimes security software wrongly blocks the program's memory access.",
      steps: [
        {
          t: "See whether it repeats only in the same program and reinstall the latest version",
          tools: [],
          how: [
            "Check whether other programs show the same error. If it repeats in only one program, it is likely a bug in that program.",
            "Remove that program completely and install the latest version again.",
            "Update both Windows and that program to the latest versions.",
            "If it keeps repeating, contact the maker or wait for an update.",
          ],
        },
        {
          t: "Check the security software's block records and DLL conflicts with other programs",
          tools: [],
          how: [
            "First check the security software's block and quarantine records and its allow list.",
            "Only when truly needed, stop the protection briefly to compare, and turn it back on right after the test.",
            "Close all other programs and run it again to see whether a DLL conflict is involved.",
          ],
        },
        {
          t: "Check the RAM with Windows Memory Diagnostic",
          tools: [],
          how: [
            "Type \"Windows Memory Diagnostic\" in the Start menu search, run it and choose \"Restart now and check for problems\" (save unsaved work first).",
            "After the restart, the test runs automatically. When Windows opens, the result appears as a notification, or you can see it under MemoryDiagnostics-Results in the System log of Event Viewer.",
            "If errors are found, install the RAM modules one at a time to find which module is the problem.",
            "If several programs show the same error, or there are also blue screens, suspect the RAM first.",
          ],
        },
        LIMIT("If the RAM test reports errors, or it repeats in several programs, a hardware check is needed, so it is safer to ask for help. If it repeats in only one program, check the maker's updates."),
      ],
    },
    r_install: {
      mode: "remote",
      title: "If an installation fails, check Windows Installer, leftover files and space in that order",
      lead: "When an installation stops partway or shows an error code, a Windows Installer service problem, leftover files from a previous install, a permission or antivirus block, or low storage space are the usual causes.",
      steps: [
        {
          t: "Check the Windows Installer service and restart it",
          tools: [],
          how: [
            "Press Win+R, type services.msc and open the services list.",
            "Find \"Windows Installer\" and look at its status. If the list is long, press W to jump near it.",
            "Right-click → \"Restart\" (\"Start\" if it is stopped). If the startup type is \"Disabled\", change it to \"Manual\" in Properties.",
            "If \"Another installation is already in progress\" (error 1618) keeps appearing, Windows Update may be installing in the background or an earlier install ended abnormally. Wait about 10 minutes, look in Task Manager's Details tab to see whether msiexec.exe is using CPU, and if it just sits idle, restart the PC.",
            "Do not force-end the program being installed. It can leave the install half done and block the next one.",
          ],
        },
        {
          t: "Remove the old version completely and clean the temporary installer files",
          tools: [],
          how: [
            "In Settings (Win+I) > Apps > Installed apps, uninstall any older version of the same program.",
            "Restart the PC after uninstalling.",
            "Press Win+R, type %temp% and delete temporary files in the folder that opens that are not in use (skip the ones that cannot be deleted because they are in use).",
            "Download the installer again from the program maker's official site and run it.",
          ],
        },
        S.diskspace,
        S.unblock,
        {
          t: "Check running as administrator, the antivirus exception and required components",
          tools: [],
          how: [
            "Right-click the installer → \"Run as administrator\" and install. This sorts out whether lack of permission was making it fail partway.",
            "If the antivirus blocks the installer, add an exception only while installing, and be sure to turn it back on afterward. Do not add an exception for a file of unclear origin.",
            "Install the latest Visual C++ Redistributable and the .NET Desktop Runtime from the official Microsoft site beforehand. If installing these components fails, the main install fails with it.",
            "If it keeps failing at the same point and the file is an .msi, make a log in Command Prompt with msiexec /i \"full path of the file.msi\" /L*v \"%temp%\\install.log\", open install.log in Notepad, search for \"Return value 3\" with Ctrl+F, and read the error number (for example 1603, 1722) on the line just above it.",
          ],
        },
        LIMIT("If the same failure repeats on every installation, Windows Installer or system permissions may be the problem and the system needs checking, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_gamelaunch: {
      mode: "remote",
      title: "If a game won't launch, look separately at the anti-cheat driver, file verification and security settings",
      lead: "When the game does not start after you press Play, or an anti-cheat error appears, check the anti-cheat driver, damaged game files, security program blocks and the memory integrity setting in turn.",
      steps: [
        {
          t: "Tell an anti-cheat error from a game that closes with no window",
          tools: [],
          how: [
            "See whether an anti-cheat message or error text appears when you launch the game. If there is text, write it down exactly.",
            "If only the logo or a black window shows for a moment and disappears with no message, suspect the components the game needs (Visual C++ Redistributable, DirectX runtime) or the program crashing rather than the anti-cheat.",
            "Check that you are not trying to run it inside a virtual machine (VMware, VirtualBox and so on). Kernel-level anti-cheat is designed to refuse to run inside a virtual machine, so it has to be installed directly on a real PC.",
            "Also look up that game's error code in the game's own support pages.",
          ],
        },
        {
          t: "Verify the game files and reinstall the anti-cheat",
          tools: [],
          how: [
            "In the game launcher (Steam, Battle.net, the publisher's launcher and so on), run \"Verify files\" or \"Repair\" for that game to re-download damaged files.",
            "For an anti-cheat error, reinstall using the anti-cheat reinstall tool that the game's official support page gives. Leave reinstalling the whole game until after these steps.",
            "If it has not worked since installing, the anti-cheat driver was probably not installed correctly.",
            "If it worked and suddenly stopped, check whether the time overlaps with a recent Windows update or a security program update.",
          ],
        },
        {
          t: "Add the game and anti-cheat to the antivirus and firewall exceptions",
          tools: [],
          how: [
            "An antivirus or firewall often blocks the anti-cheat driver installation. Open the exception settings of the antivirus you use.",
            "Add the game's install folder and the anti-cheat executable to the real-time scan exceptions. Add only the official game folder.",
            "In Windows Security's Firewall > \"Allow an app through firewall\", also check that the game and launcher are allowed.",
            "After adding the exceptions, try launching the game again.",
          ],
        },
        {
          t: "Check the memory integrity (Core isolation) setting",
          tools: [],
          how: [
            "Type \"Windows Security\" in the Start menu search, open it and click \"Device security\".",
            "Open \"Core isolation details\" and see whether \"Memory integrity\" is on. Some newer anti-cheat programs only allow certain games to run when memory integrity (VBS/HVCI) is on.",
            "Check the game's official guidance before changing the setting, and if it is off and required, turn it on and restart the PC.",
            "Some old drivers or particular security software can conflict with it and cause a blue screen, and you can turn it off again from the same screen if a problem appears.",
          ],
        },
        S.evt,
        LIMIT("If the game maker's support tools do not fix it, contact the game's support. Do not force security features (Secure Boot, memory integrity) off or on; it is safer to hand it over."),
      ],
      guides: [],
    },
    r_updloop: {
      mode: "remote",
      title: "If an update keeps failing, check the history, cache, space and a manual install in that order",
      lead: "When the same update keeps failing, the same component is being blocked. Write down the failure code and the update name, then check temporary files and the cache, disk space, external devices and security programs.",
      warn: "Do not repeat forced shutdowns with the power button during an update. The rollback can be cut off and cause boot problems.",
      steps: [
        {
          t: "Check the failed items and codes in the update history",
          tools: [],
          how: [
            "Open Settings (Win+I) > Windows Update > Update history.",
            "Under \"Feature updates\" and \"Quality updates\", find the items marked \"Failed to install\".",
            "Write down the name, KB number and date of the failed item, and check the error code under \"More info\" at the right.",
            "If the same code repeats, the cache or a service is more likely the problem; if a different code appears each time, look more at outside conditions such as lack of space, power cuts or policy conflicts.",
          ],
        },
        {
          t: "Run the Windows Update troubleshooter",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Troubleshoot > Other troubleshooters.",
            "Click \"Run\" next to \"Windows Update\" and follow the instructions.",
            "If the troubleshooter says it fixed something, restart the PC.",
            "After restarting, try the update again in Settings > Windows Update.",
          ],
        },
        S.diskspace,
        {
          t: "Disconnect external devices and check the power conditions",
          tools: [],
          how: [
            "On a laptop, connect the power adapter and make sure sleep or shutdown cannot interrupt the installation. It stops if it runs only on battery or loses power partway.",
            "Unplug unneeded USB devices such as USB storage, printers and docking stations.",
            "If you have a third-party security or optimization program, turn it off for a while and try the update.",
            "If it succeeds under these conditions, the device you removed or the program you turned off is a candidate cause. Do not force a shutdown with the power button each time it fails, because that interrupts the rollback.",
          ],
        },
        {
          t: "Install the same KB by hand from the Microsoft Update Catalog",
          tools: [],
          how: [
            "Use this method only when the KB number of the failed item is the same every time. If you are not sure which KB it is, do not do this.",
            "In a browser, go to catalog.update.microsoft.com and search for that KB number.",
            "Download the .msu file that matches your Windows version and system type (mostly x64) and run it. Do not download it from sites of unclear origin.",
            "If it fails at the same place even with the manual install, the cause is not the download but system components or the disk, so move on to the system file scan (SFC, DISM) and a disk check.",
          ],
        },
        S.sfc,
        LIMIT("If it fails at the same place even with the manual install and SFC and DISM, the disk or system components need checking, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_upgrade: {
      mode: "remote",
      title: "If the Windows 11 upgrade won't install, first find the exact reason (TPM, Secure Boot, space)",
      lead: "What to do about a blocked upgrade or 24H2 install depends completely on whether the reason is TPM, Secure Boot, the CPU or storage space. First find out the exact reason.",
      steps: [
        {
          t: "Find the exact reason with the PC Health Check app",
          tools: [],
          how: [
            "Download and install Microsoft's \"PC Health Check\" app from the official site.",
            "Run the app and click \"Check now\" under the Windows 11 support check.",
            "Write down which items (TPM, Secure Boot, CPU, storage and so on) are shown as not met.",
            "If TPM shows as 2.0 and it is still blocked, the remaining candidates are the CPU support list or Secure Boot.",
          ],
        },
        {
          t: "Check the TPM 2.0 and Secure Boot state",
          tools: [],
          how: [
            "Press Win+R, type tpm.msc and open \"TPM Management\". Check that the \"Specification Version\" at the bottom right is 2.0. If it says \"Compatible TPM cannot be found\", the TPM (Intel PTT, AMD fTPM) is off in the BIOS.",
            "Press Win+R, type msinfo32 and see whether \"BIOS Mode\" is UEFI and \"Secure Boot State\" is \"On\".",
            "If you have to turn it on in the BIOS, turn on the TPM (or Intel PTT, AMD fTPM) and Secure Boot. If you cannot turn Secure Boot on, also check that CSM (legacy compatibility mode) is not on. Menu names and places differ by maker, so photograph the current settings before changing them.",
            "If the version shows 1.2, that motherboard's TPM module does not support 2.0, so settings alone cannot fix it.",
          ],
        },
        {
          t: "Check storage space, the disk partition style and external devices",
          tools: [],
          how: [
            "Feature updates and upgrades keep the previous version temporarily, so they need much more free space than ordinary updates. In Settings > System > Storage, check that the C: drive has at least 20 to 30 GB free for 24H2 and 64 GB or more for an upgrade.",
            "Check that the disk uses GPT/UEFI (an MBR disk needs converting).",
            "Unplug every USB device such as printers, external drives and docking stations and try again. There are reports of external devices causing driver conflicts that lead to 0x80240069.",
            "Run \"Windows Update\" from Settings > System > Troubleshoot > Other troubleshooters.",
          ],
        },
        {
          t: "Upgrade directly with installation media (the official installer)",
          tools: [],
          how: [
            "Use this when Windows Update keeps failing. Download the Windows 11 installation assistant or media creation tool from the official Microsoft site.",
            "This way only skips some checks of the Windows Update route; you still have to meet the minimum system requirements such as TPM 2.0.",
            "Back up your important data before installing.",
            "If the install rolls back to the previous version at a certain percentage, an incompatible driver or peripheral, or third-party antivirus, disk encryption or virtualization utilities may be the cause, so temporarily remove or update them and try again.",
          ],
        },
        LIMIT("If the CPU is not on the official support list, a workaround install can limit later update support, so be careful. If the BIOS settings are hard for you, it is safer to hand it over."),
      ],
      guides: [],
    },
    r_activation: {
      mode: "remote",
      title: "For an activation error, first check the exact code and the license type",
      lead: "The cause of an activation error differs completely by code. Sort out in turn the exact error code, whether you can reach the activation server, whether you changed hardware, and the license type (retail, OEM, volume).",
      steps: [
        {
          t: "Write down the error code and text on the activation screen",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Activation.",
            "When it is fine you see \"Active\" with a green check; when there is a problem, an error code and text appear. Write them down exactly.",
            "\"Windows is activated with a digital license linked to your Microsoft account\" means it is linked to the account, while \"Windows is activated with a digital license\" alone means it is not yet linked to the account. In the latter case it is safer to link it before you change hardware.",
            "Once you have the code, go on to the next step.",
          ],
        },
        {
          t: "Run the activation troubleshooter",
          tools: [],
          how: [
            "On Settings > System > Activation, click the \"Troubleshoot\" button (only when it is shown).",
            "Follow the instructions. If you changed hardware, choose \"I changed hardware on this device recently\" to reactivate with the digital license of your account (replacing the motherboard is the biggest change that makes Windows see \"a different PC\").",
            "If the license was linked to a Microsoft account, sign in with that account to continue.",
            "When the troubleshooter finishes, check whether the status on the activation screen has changed.",
          ],
        },
        {
          t: "Check the network and DNS to see whether you can reach the activation server",
          tools: [],
          how: [
            "Check in a browser that the internet works. If it cannot reach the activation server, even a legitimate license can look temporarily not activated.",
            "Switch the router off and on, restart the PC and try again.",
            "If you suspect DNS, try changing DNS to a public DNS (for example 8.8.8.8) in the adapter settings, and change it back afterward.",
            "On a company or school network, policy can block the activation server connection, so ask the administrator.",
          ],
        },
        {
          t: "Check the license type (retail, OEM, volume) with slmgr /dli",
          tools: [],
          how: [
            "Type cmd in the Start menu search and click \"Run as administrator\".",
            "Type slmgr /dli and press Enter.",
            "In the window that appears, check the channel in the description, such as RETAIL, OEM or VOLUME_KMS.",
            "If it is in the VOLUME family, it is a volume license distributed by a company or school, so entering a personal product key will not solve it; check with the organization's administrator or the connection to that server (KMS needs periodic renewal).",
            "A product key bought for a used PC or at a very low price may already be in use on another machine or be a volume license, and the troubleshooter will not fix that.",
          ],
        },
        LIMIT("A problem with the product key itself or an organization's license is not something you can fix yourself. Check with where you bought it or with the organization's administrator, or hand it over. Do not use activation tools of unclear origin."),
      ],
      guides: [],
    },
    r_msaccount: {
      mode: "remote",
      title: "If Microsoft account sign-in fails, separate the account from the PC side",
      lead: "Checking whether the same account signs in on the web first tells you whether the account itself or this PC's settings is the problem. Check the time, saved sign-in information, two-step verification and the PIN in turn.",
      steps: [
        {
          t: "Try signing in with the same account in a web browser",
          tools: [],
          how: [
            "In a browser, go to account.microsoft.com and try to sign in with the same account.",
            "If it signs in normally, the account itself is fine and the problem is on the Windows (this PC) side.",
            "If it fails here too, it may be a password or security check problem, so follow the account recovery instructions. If you sign in from an unusual location or device, Microsoft may ask for extra verification with your registered email or phone number.",
            "It may also be a Microsoft service outage, so try again a little later.",
          ],
        },
        S.timesync,
        {
          t: "Delete saved sign-in information in Credential Manager",
          tools: [],
          how: [
            "Type \"Credential Manager\" in the Start menu search and open it.",
            "Click \"Windows Credentials\" and look for entries related to the Microsoft account (such as MicrosoftAccount).",
            "Expand the entry and click \"Remove\". This sorts out old saved information conflicting with a changed password and making sign-in keep failing.",
            "Restart the PC and sign in again.",
          ],
        },
        {
          t: "Sort out two-step verification, the PIN and the account type",
          tools: [],
          how: [
            "If two-step verification codes keep being rejected, turn on automatic time sync on both the authenticator app and the PC.",
            "If the password works but only the PIN or Windows Hello (face or fingerprint) fails, it may be a tangled PIN rather than the account. Sign in with \"Password\" under Sign-in options, then set the PIN up again in Settings (Win+I) > Accounts > Sign-in options.",
            "Check whether the account you are trying to sign in with is a Microsoft account, a local account only for this PC, or a work or school account. With a different type, the password can differ even for the same email.",
            "If you no longer use the registered recovery email or phone number, you cannot receive verification codes, so update your security info while you can still sign in.",
          ],
        },
        LIMIT("If you have lost both the recovery email and phone number and account recovery is blocked, you have to follow Microsoft's account recovery process. If that is hard for you, hand it over."),
      ],
      guides: [],
    },
    r_store: {
      mode: "remote",
      title: "For a Store error, check the cache reset, time, account and storage location in turn",
      lead: "When the Store won't open or an app stays at \"Pending\", check the Store cache, the system time, the account sign-in, and the install service and storage location in turn. Also tell apart one app failing from the whole Store failing.",
      steps: [
        {
          t: "Reset the Store cache with WSReset",
          tools: [],
          how: [
            "Press Win+R, type wsreset.exe and run it.",
            "If a black window appears for a moment and the Store then opens by itself, the cache was reset normally. Do not close the window; wait.",
            "Check that the Store home screen appears normally.",
            "If an error code shows, write it down. 0x80072EFD is often a network or time problem, 0x80070005 an account permissions problem and 0x803FB005 a corrupted cache.",
          ],
        },
        S.timesync,
        {
          t: "Sign out of your Microsoft account and sign in again",
          tools: [],
          how: [
            "Open Settings (Win+I) > Accounts.",
            "Sign out of the Microsoft account used by the Store (if needed, sign out from the profile icon in the Store app).",
            "Restart the PC.",
            "Open the Store, sign in again and see whether the symptom has changed.",
          ],
        },
        {
          t: "Reset and re-register the Store app",
          tools: [],
          how: [
            "In Settings (Win+I) > Apps > Installed apps, find \"Microsoft Store\", click the three dots → \"Advanced options\". Click \"Repair\" first and, if that does not work, \"Reset\". Reset erases the app data.",
            "If that still does not work, right-click the Start button and open \"PowerShell (Admin)\" or \"Terminal (Admin)\".",
            "Enter and run Get-AppxPackage -allusers Microsoft.WindowsStore | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register \"$($_.InstallLocation)\\AppXManifest.xml\"} (copy and paste it).",
            "When it finishes, restart the PC and open the Store.",
          ],
        },
        {
          t: "Check the install service, the storage location, and whether only one app fails",
          tools: [],
          how: [
            "If the Store opens but an app stays at \"Pending\" or 0%, press Win+R > services.msc and check that the \"Microsoft Store Install Service\" and \"Windows Update\" services are not stopped.",
            "In Settings > System > Storage > Advanced storage settings, check that \"Where new content is saved\" does not point to a disconnected external drive or a full drive. If the saving location cannot be written to, installs will not start however much you run WSReset.",
            "If other apps download fine and only one fails, look at that app's requirements. Check \"System requirements\" on the app's page (minimum Windows version, storage needed) and that \"Country or region\" under Settings > Time & language > Language & region is a region where the app is offered.",
            "If every app you click shows the same symptom, the Store-wide checks above are the right order.",
          ],
        },
        LIMIT("If it still fails after re-registering the Store, a check of Windows components (SFC, DISM) may be needed, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_search: {
      mode: "remote",
      title: "If Windows Search isn't working, find where it fails, then check the service and the index",
      lead: "First tell whether search gives no response at all or only some items are missing, and whether the Start menu or File Explorer is the one failing. Then check the Windows Search service and the indexing settings.",
      steps: [
        {
          t: "Tell no response from only some items missing, and where it fails",
          tools: [],
          how: [
            "Type several search terms in the search box and check whether there is no response at all or only certain items are missing.",
            "Test Start menu search and File Explorer search separately. The Start menu searches installed apps and indexed items, while File Explorer also scans locations that are not indexed directly, so results can appear in only one of them.",
            "Right after moving large files, adding a new drive or a Windows update, the index may be rebuilding and results may be missing for a while, so wait a little.",
            "Write down where and how it fails.",
          ],
        },
        {
          t: "Check that the Windows Search service is running",
          tools: [],
          how: [
            "Press Win+R, type services.msc and open the services list.",
            "Find \"Windows Search\" and check that its status is \"Running\".",
            "If it is stopped, right-click → \"Start\". The startup type is normally \"Automatic (Delayed Start)\".",
            "After starting it, search again.",
          ],
        },
        {
          t: "Check the folders in Indexing Options and rebuild the index",
          tools: [],
          how: [
            "Open Settings (Win+I) > Search > Searching Windows > \"Advanced indexing options\" (or \"Indexing Options\" from the Start menu).",
            "See whether the folder you are looking for is on the list. If it is not included, its files will not show up in indexed search however many there are. Click \"Modify\" and add the folder.",
            "Click \"Advanced\" > \"Rebuild\" to build the index afresh. While the index is being built, search is incomplete and takes time.",
            "If the search-related process (Microsoft Windows Search Indexer) in Task Manager keeps using a lot of CPU or disk for long, try excluding large folders you do not need from the index.",
          ],
        },
        LIMIT("If it repeats even after rebuilding the index, system file checks may be needed, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_clip: {
      mode: "remote",
      title: "If copy and paste isn't working, first tell whether it is every app or one app",
      lead: "Depending on whether it fails even in Notepad, only in one app, or in a remote or virtual machine setup, separate the clipboard service, clipboard utilities and app settings.",
      steps: [
        {
          t: "Tell the range by whether it fails in Notepad too",
          tools: [],
          how: [
            "Open Notepad, copy some text (Ctrl+C) and paste it (Ctrl+V).",
            "If it fails in Notepad too, the clipboard service itself is the problem.",
            "If Notepad works but only a certain app fails, look first at that app's permissions or its clipboard access block settings.",
            "If text works but only files copied in File Explorer or screenshots won't paste, the cause may be explorer.exe rather than the whole clipboard, so right-click \"Windows Explorer\" in Task Manager → \"Restart\" and try again. Notepad cannot paste a file itself.",
          ],
        },
        {
          t: "Turn on clipboard history and test with Win+V",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Clipboard.",
            "Turn on \"Clipboard history\".",
            "Copy some text and press Win+V to see whether history builds up.",
            "If it shows in the history but pasting fails, the problem may be in the target app.",
          ],
        },
        {
          t: "Check clipboard sharing in a remote desktop or virtual machine",
          tools: [],
          how: [
            "If you are connected by Remote Desktop (RDP), check that \"Clipboard\" is ticked on the \"Local Resources\" tab under \"Show Options\" on the connection screen. If the server's group policy blocks the clipboard, you have to ask the administrator.",
            "In Task Manager, find rdpclip.exe and \"End task\", then type rdpclip in \"Run new task\" at the top to start it again.",
            "If it is a virtual machine such as VMware or VirtualBox, set \"Clipboard sharing\" to bidirectional in its settings.",
            "If none of this applies, skip this step.",
          ],
        },
        {
          t: "Turn off programs and extensions that watch the clipboard and compare",
          tools: [],
          how: [
            "In Settings > Apps > Installed apps, sort by install date and look for recently installed utilities that watch the clipboard, such as password managers, translation programs and screen capture tools.",
            "Exit the program you suspect (\"Exit\" from its notification area icon) and test copy and paste again.",
            "If it fails only in the browser, turn off all extensions that read and write the clipboard and turn them on one at a time to find it.",
            "If you change several at once you cannot tell the cause, so compare one at a time.",
          ],
        },
        LIMIT("If it keeps failing in every app and the steps above do not fix it, system components need checking, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_phone: {
      mode: "remote",
      title: "If Phone Link won't connect, check the account, battery optimization, the network and the versions",
      lead: "Phone Link needs the PC and the phone app to be signed in with the same Microsoft account, and battery optimization, router wireless isolation and app versions often block the connection. This is for Android.",
      steps: [
        {
          t: "Check that the PC and the phone use the same Microsoft account",
          tools: [],
          how: [
            "On Android, open Settings > Advanced features > Link to Windows and check the account email you are signed in with.",
            "Compare it with the account signed in to the \"Phone Link\" app on the PC.",
            "If they differ, sign in again so that both use the same account.",
            "If it is the same account and still fails, go on to the next step.",
          ],
        },
        {
          t: "Turn off battery saving and battery optimization and allow the app permissions",
          tools: [],
          how: [
            "In Android Settings > Battery > Background usage limits (battery optimization), set the \"Link to Windows\" app to \"Not optimized\".",
            "Check that battery saver is off on both the PC and the phone.",
            "On Android 10 or later, open Settings > App info > Show all apps > Link to Windows > Permissions and allow Storage, Contacts, SMS and Phone. If even one permission is denied, only that feature quietly fails to appear.",
            "Turn Notification access off and on again in its own separate menu.",
          ],
        },
        {
          t: "If it fails on the same Wi-Fi, check the router's wireless isolation",
          tools: [],
          how: [
            "Check that the PC and the phone are on the same router and the same Wi-Fi.",
            "In the router admin page, under advanced wireless settings, check that \"AP isolation\" or \"wireless isolation\" is off. When it is on, devices cannot talk to each other even on the same router.",
            "Router menu names and places differ by maker.",
            "If you changed the setting, connect the PC and the phone again and test.",
          ],
        },
        {
          t: "Check the minimum app versions and Samsung DeX",
          tools: [],
          how: [
            "Update Phone Link on the PC to 1.23112.85.0 or later and the \"Link to Windows\" app on Android to 1.24021.164.0 or later. Check the actual version number in the settings of both apps yourself.",
            "Opening Samsung DeX and Phone Link at the same time can make both apps misbehave. If you are using DeX, exit Phone Link and run only one at a time.",
            "If \"An update is required\" keeps appearing, report it with diagnostic data through the Feedback Hub, which is the official recommended procedure.",
            "This check does not cover iPhone.",
          ],
        },
        LIMIT("If it still won't connect after all the settings above, an account link or the device side may be the problem, so it is safer to hand it over. iPhone is not covered by this check."),
      ],
      guides: [],
    },
  };

  window.ITSVC_WIZARD = { nodes: NODES };

  // Per-step notes (c: cause candidate, m: rough time, l: difficulty, w: why, r: how to read the result).
  // The time is a rough estimate based on the kind of task, not a measurement.
  window.ITSVC_WIZARD_META = Object.assign(window.ITSVC_WIZARD_META || {}, {
    "End the process completely, restart the PC and run it with normal rights": {"c": "A stuck process or a pending update state", "m": "About 5 min", "l": "Easy", "w": "A leftover background process can block a new launch, so end it completely, restart and compare.", "r": "If it opens after restarting → a leftover process was the problem."},
    "Run System File Checker (SFC) and DISM repair": {"c": "Corrupted Windows system files", "m": "About 30 min", "l": "Moderate", "w": "When Windows' own files are corrupted, many programs can go wrong at once. Scan and repair with the tools built into Windows.", "r": "If the symptom goes away after the scan and repair → corrupted system files were the cause."},
    "Run a full scan with Windows Security": {"c": "Malware", "m": "30+ min", "l": "Easy", "w": "This rules out malicious software damaging program launching or file associations. It takes long but it is easy to miss.", "r": "If a threat is found → remove it and check whether the symptom goes away."},
    "Test with a new user account to tell whether it is your own account": {"c": "Corrupted profile, settings or permissions in your account", "m": "About 15 min", "l": "Moderate", "w": "A new account starts with clean settings, so comparing whether the same symptom appears tells you whether it is the account or the system.", "r": "If it is normal in the new account → the problem is on your own account's side."},
    "Set the date and time automatically": {"c": "The PC clock or time zone being off", "m": "About 3 min", "l": "Easy", "w": "If the PC time is far from the real time, security checks fail and sign-in or the Store may not work.", "r": "If it works once the time is right → it was a time problem."},
    "Check the \"Unblock\" mark on a downloaded file": {"c": "The origin mark (Mark of the Web) on files from the internet", "m": "About 5 min", "l": "Easy", "w": "Files from the internet carry an origin mark, and SmartScreen or security settings can block running them.", "r": "If it opens after unblocking → the origin mark was blocking it (only for files you trust)."},
    "Check that you are not short of storage space, and clean it up": {"c": "Short of storage space", "m": "About 15 min", "l": "Easy", "w": "When the C: drive is nearly full, installs and updates stop partway or fail with unknown errors.", "r": "If it works once space is freed → lack of space was the cause."},
    "Check the failure time and module with Event Viewer and the Reliability Monitor": {"c": "The faulting module (program, runtime or driver)", "m": "About 10 min", "l": "Moderate", "w": "Even when a program closes with no window, the Reliability Monitor often keeps the failure time and the faulting module.", "r": "If a module name shows → it points to repairing the program or reinstalling a runtime."},
    "Write down the error text and compare with whether basic programs open": {"c": "One program's problem versus a whole-system problem", "m": "About 5 min", "l": "Easy", "w": "What to check changes completely depending on whether only one program is affected or the whole system.", "r": "If basic programs open and only this one fails → the problem is with that program."},
    "Use \"Repair\" for the program in Installed apps": {"c": "Damaged program files or settings", "m": "About 10 min", "l": "Easy", "w": "Repair fixes the damaged parts while keeping your data. Try it before Reset.", "r": "If it opens after repair → part of the program was damaged."},
    "Check the security program's quarantine record and the required components": {"c": "Antivirus quarantine or a missing runtime", "m": "About 20 min", "l": "Moderate", "w": "If a runtime is missing or the antivirus quarantined a file, reinstalling only the program repeats the same problem.", "r": "If there is a quarantine record, or it opens once you install the runtime → that was the cause."},
    "Tell apart file associations and where you run it from": {"c": "A broken file association, or a block depending on location", "m": "About 10 min", "l": "Easy", "w": "A plain white icon or an \"Open with\" window means the file association is broken, and a symptom that depends on location points to a block mark.", "r": "If it fails everywhere → look at the system files. If only in some locations → look at the block mark and security limits."},
    "Turn off recently installed startup programs for a while and compare": {"c": "A startup program or shell extension conflict", "m": "About 15 min", "l": "Moderate", "w": "A program hooked into the right-click menu or startup can delay or block the launch of other apps.", "r": "If it is normal with them off → that program is a candidate cause."},
    "Check the Windows Installer service and restart it": {"c": "The Windows Installer service stopped or in conflict", "m": "About 10 min", "l": "Moderate", "w": "If this service is stopped or in conflict, no installation finishes properly.", "r": "If it installs after the restart → the service was the problem."},
    "Remove the old version completely and clean the temporary installer files": {"c": "Conflict with leftover files from an earlier install", "m": "About 15 min", "l": "Easy", "w": "Files of an old version that were left behind often conflict with the new install.", "r": "If it installs after cleaning → leftover files were the cause."},
    "Check running as administrator, the antivirus exception and required components": {"c": "Permissions, antivirus block, missing Visual C++ or .NET", "m": "About 20 min", "l": "Moderate", "w": "Lack of permission, an antivirus block or a missing required component are the usual reasons an install fails partway.", "r": "If it works once you install the runtime first or raise the permission → that was the cause."},
    "Tell an anti-cheat error from a game that closes with no window": {"c": "Anti-cheat problem versus a launch component problem", "m": "About 5 min", "l": "Easy", "w": "What to suspect depends on whether an anti-cheat window appears or the game vanishes with no window.", "r": "If it vanishes with no window → look at the runtime and crash log first. If an anti-cheat message appears → start with the driver."},
    "Verify the game files and reinstall the anti-cheat": {"c": "Damaged game files or the anti-cheat driver", "m": "About 20 min", "l": "Moderate", "w": "Files damaged during patching, or an anti-cheat driver that was not installed properly, block the launch.", "r": "If it launches after verifying or reinstalling → files or the driver were the problem."},
    "Add the game and anti-cheat to the antivirus and firewall exceptions": {"c": "Antivirus or firewall blocking the anti-cheat", "m": "About 10 min", "l": "Moderate", "w": "An antivirus or firewall often blocks the anti-cheat driver installation.", "r": "If it launches after adding exceptions → the security program was blocking it."},
    "Check the memory integrity (Core isolation) setting": {"c": "Memory integrity (VBS/HVCI) setting", "m": "About 10 min", "l": "Moderate", "w": "Some newer anti-cheat programs allow certain games only when memory integrity is on.", "r": "If it launches after turning it on → this was a game that requires the setting."},
    "Check the failed items and codes in the update history": {"c": "The pattern of repeated failures", "m": "About 5 min", "l": "Easy", "w": "What to suspect depends on whether the same code repeats or it changes each time.", "r": "If the same code repeats → cache or services. If it differs each time → space, power or policy."},
    "Run the Windows Update troubleshooter": {"c": "Damaged update components", "m": "About 10 min", "l": "Easy", "w": "For damaged components, an automatic diagnostic tool often finds the problem faster than looking by hand.", "r": "If the troubleshooter fixes it and the update works → it was a component problem."},
    "Disconnect external devices and check the power conditions": {"c": "External devices and power conditions", "m": "About 15 min", "l": "Easy", "w": "USB devices or old security programs can interfere with drivers during installation and make it fail.", "r": "If it succeeds after disconnecting or turning off → that device or program is a candidate cause."},
    "Install the same KB by hand from the Microsoft Update Catalog": {"c": "A problem in the download or search stage", "m": "About 20 min", "l": "Moderate", "w": "This skips the download and search stage of Windows Update to tell whether the cause was there.", "r": "If the manual install works → the download component was the cause. If it fails at the same place → it is the system or the disk."},
    "Find the exact reason with the PC Health Check app": {"c": "Finding which requirement is not met", "m": "About 10 min", "l": "Easy", "w": "What to do depends completely on whether the block is TPM, CPU or storage, so first find the exact reason.", "r": "If it shows which item is not met → fix that item first."},
    "Check the TPM 2.0 and Secure Boot state": {"c": "TPM or Secure Boot turned off", "m": "About 15 min", "l": "Moderate", "w": "Even if the TPM is on the motherboard, it is shown as unsupported when it is turned off in the BIOS.", "r": "If TPM and Secure Boot are on and it is still blocked → look at the CPU support list."},
    "Check storage space, the disk partition style and external devices": {"c": "Storage space, an MBR disk or external devices", "m": "About 20 min", "l": "Moderate", "w": "A feature update keeps the previous version, so it needs far more space than an ordinary update.", "r": "If it works after freeing space or unplugging devices → that was the cause."},
    "Upgrade directly with installation media (the official installer)": {"c": "A problem in the Windows Update route", "m": "About 60 min", "l": "Careful", "w": "This is a method of upgrading directly with the official installer when Windows Update keeps failing. The requirements still apply.", "r": "If it works with the media → the Windows Update route was the problem."},
    "Write down the error code and text on the activation screen": {"c": "The error code and whether it is linked to an account", "m": "About 5 min", "l": "Easy", "w": "The cause differs completely by code, so first check the exact code rather than \"it doesn't work\".", "r": "If you have written down the code → you can narrow the cause by code."},
    "Run the activation troubleshooter": {"c": "A hardware change or a license mismatch", "m": "About 10 min", "l": "Easy", "w": "It automatically diagnoses common causes (hardware replacement, a license mismatch) and reactivates through the account.", "r": "If it shows \"Active\" after the troubleshooter → it was a hardware change or a mismatch."},
    "Check the network and DNS to see whether you can reach the activation server": {"c": "Unable to reach the activation server", "m": "About 10 min", "l": "Moderate", "w": "If it cannot reach the activation server, even a legitimate license can look not activated.", "r": "If it activates once the connection is fixed → it was a network problem."},
    "Check the license type (retail, OEM, volume) with slmgr /dli": {"c": "The license type, or a volume license", "m": "About 5 min", "l": "Moderate", "w": "A volume license or a key already in use cannot be used for a personal reinstall, so the troubleshooter will not fix it.", "r": "If it is in the VOLUME family → ask the organization's administrator."},
    "Try signing in with the same account in a web browser": {"c": "The account itself versus this PC's settings", "m": "About 5 min", "l": "Easy", "w": "If it signs in normally in a browser, the account is fine and the problem is on this PC.", "r": "If it works in the browser → the problem is on the PC settings side."},
    "Delete saved sign-in information in Credential Manager": {"c": "Old saved sign-in information conflicting", "m": "About 10 min", "l": "Easy", "w": "Old saved information conflicting with a changed password makes sign-in keep failing.", "r": "If you can sign in after removing it → the saved information was in conflict."},
    "Sort out two-step verification, the PIN and the account type": {"c": "Two-step verification time, a tangled PIN or the account type", "m": "About 10 min", "l": "Easy", "w": "If the password works but only the PIN fails, or codes keep being rejected, the cause is something other than the account.", "r": "If only the PIN fails → register the PIN again. If codes are rejected → check time sync."},
    "Reset the Store cache with WSReset": {"c": "A corrupted Store cache", "m": "About 5 min", "l": "Easy", "w": "This is the basic reset to try first when the Store acts up.", "r": "If the Store opens by itself → it reset normally. Check whether the symptom has gone."},
    "Sign out of your Microsoft account and sign in again": {"c": "A Store account authentication problem", "m": "About 5 min", "l": "Easy", "w": "If the account authentication gets tangled, the Store won't open or installs fail.", "r": "If it works after signing in again → it was an account authentication problem."},
    "Reset and re-register the Store app": {"c": "Damage to the Store app itself", "m": "About 15 min", "l": "Moderate", "w": "When repair and reset are not enough, re-registering sets the Store's components up afresh.", "r": "If it opens after re-registering → the Store app was damaged."},
    "Check the install service, the storage location, and whether only one app fails": {"c": "A stopped install service, the storage location, or an app's requirements", "m": "About 15 min", "l": "Moderate", "w": "If the Store opens but installs fail, suspect the service that does the actual install, or the storage location, rather than the cache.", "r": "If it works after starting the service or fixing the location → that was the cause."},
    "Tell no response from only some items missing, and where it fails": {"c": "The search scope, or indexing in progress", "m": "About 5 min", "l": "Easy", "w": "Start menu and File Explorer search work differently, so telling where it fails narrows the cause.", "r": "If it fails in only one of them → look at the indexed locations or the service."},
    "Check that the Windows Search service is running": {"c": "The Windows Search service stopped", "m": "About 5 min", "l": "Easy", "w": "If the service in charge of search is stopped, search does not work at all.", "r": "If search works after starting the service → the stopped service was the cause."},
    "Check the folders in Indexing Options and rebuild the index": {"c": "Missing indexed folders or a damaged index", "m": "About 20 min", "l": "Moderate", "w": "Folders not on the index list are not searched, and a damaged index drops results.", "r": "If search works after the rebuild → it was an index problem."},
    "Tell the range by whether it fails in Notepad too": {"c": "The whole clipboard versus one app or File Explorer", "m": "About 5 min", "l": "Easy", "w": "Whether it fails in every app or only one decides whether to look at the clipboard service or that app.", "r": "If it fails in Notepad too → the clipboard side. If only one app → that app's settings."},
    "Turn on clipboard history and test with Win+V": {"c": "The clipboard history feature turned off", "m": "About 3 min", "l": "Easy", "w": "Seeing whether history builds up tells you whether copying itself fails or only pasting.", "r": "If history builds up → copying works and the paste target is the problem."},
    "Check clipboard sharing in a remote desktop or virtual machine": {"c": "Clipboard sharing settings in remote or virtual machines", "m": "About 10 min", "l": "Moderate", "w": "In remote or virtual environments, if sharing is off, copy and paste work in one direction only or not at all.", "r": "If it works after turning sharing on or restarting rdpclip → it was a sharing setting."},
    "Turn off programs and extensions that watch the clipboard and compare": {"c": "A clipboard utility conflict", "m": "About 15 min", "l": "Moderate", "w": "When utilities that read and write the clipboard overlap, copied content vanishes or pasting fails.", "r": "If it is normal with them off → that program is the cause."},
    "Check that the PC and the phone use the same Microsoft account": {"c": "The two sides using different accounts", "m": "About 5 min", "l": "Easy", "w": "If the two apps use different Microsoft accounts, they will not connect.", "r": "If it connects once the accounts match → the accounts did not match."},
    "Turn off battery saving and battery optimization and allow the app permissions": {"c": "Battery optimization or denied app permissions", "m": "About 10 min", "l": "Easy", "w": "If battery optimization or a denied permission makes the app stop in the background, the connection drops or only some features fail.", "r": "If it connects after changing the settings → battery optimization or permissions were the cause."},
    "If it fails on the same Wi-Fi, check the router's wireless isolation": {"c": "Router AP isolation", "m": "About 10 min", "l": "Moderate", "w": "When AP isolation is on, the PC and the phone cannot talk to each other even on the same Wi-Fi.", "r": "If it connects after turning isolation off → the router setting was the cause."},
    "Check the minimum app versions and Samsung DeX": {"c": "App versions or running Samsung DeX at the same time", "m": "About 10 min", "l": "Easy", "w": "Old app versions, or opening DeX at the same time, make it misbehave.", "r": "If it works after updating or changing the setting → that was the cause."},
  });
})();
