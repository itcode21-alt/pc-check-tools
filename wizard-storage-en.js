(() => {
  // English edition of the storage and data self-check (wizard-storage.js). The behavior lives in symptom-wizard.js
  // and the screen text in wizard-ui-en.js. This is a faithful translation of the Korean wizard: no new claims.
  // Windows menu names are the English Windows 11 names. Links that point to Korean-only guides are left out.
  const OPEN_DESKTOP = "You need to open the side panel of the case";
  const SAFE_OFF = "Shut Windows down, unplug the power cord from the back of the PC, then hold the power button for 3 to 5 seconds to drain the remaining electricity. After that, if the PSU (power supply) has a switch on its back, flip it to O (off).";
  const DRV = "A Phillips screwdriver (not needed if the side panel uses thumbscrews)";
  const LIMIT = (text) => ({ limit: true, t: text });

  const S = {
    smart: {
      t: "Check the storage device's health (SMART)",
      tools: ["A disk health program such as CrystalDiskInfo (a free tool you can install)"],
      how: [
        "Download a program such as CrystalDiskInfo from its official website and install it.",
        "When you open the program, you can pick a storage device on the tabs at the top, and its \"Health Status\" is shown.",
        "If it shows \"Caution\" or \"Bad\", or items such as \"Reallocated Sectors Count\" or \"Current Pending Sector Count\" have a value, the storage device is in poor condition.",
        "For an SSD, you can also put the result into this site's SSD health check tool to have it interpreted.",
        "If the condition is poor, back up your important data to another place first. Using the device for long, or trying to recover from it, can make things worse.",
      ],
    },
    biosDisk: {
      t: "Check whether the disk shows up in the BIOS",
      tools: [],
      how: [
        "Switch the PC fully off. As soon as you press the power button, keep pressing the Del key (or F2) two or three times a second to enter the BIOS screen. The key differs by manufacturer and is shown at the bottom of the screen at start-up.",
        "On the BIOS screen, open the Boot or Storage section. On some boards you have to switch to \"Advanced Mode (F7)\" to see it.",
        "Check whether an SSD or HDD name (including NVMe) is listed. If the product name shows, the disk is detected.",
        "If it shows, the disk is detected. If it does not, the problem may be the connection or the disk itself.",
        "Only look, then leave with Esc without saving.",
      ],
    },
    diskCables: {
      t: "Check the disk connections and re-seat them",
      tools: [DRV, "A spare SATA cable (optional: swap it in to test if you have one)"],
      spare: "If you have a cheap SATA cable, or a spare cable you know works (a used one is fine), swapping it in to test is recommended.",
      needs: OPEN_DESKTOP,
      how: [
        SAFE_OFF,
        "Open the side panel and find the disk in question. If it is a SATA disk, you will see a data cable and a wide power cable going to it.",
        "Unplug the SATA cable from both the disk and the motherboard, then plug it back in all the way. Unplug and re-plug the power cable as well.",
        "If it is an M.2 drive (a small stick that plugs directly into the motherboard), check that it sits fully in its slot at a slight angle and that the fixing screw at the end is fastened. You can pull it out and plug it back in.",
        "Try a different SATA port on the motherboard or a different cable.",
        "Plug the power cord in, switch on, and check again in the BIOS whether the disk shows up.",
      ],
    },
    portTest: {
      t: "Plug it straight into another USB port (on the back of the PC)",
      tools: ["A different USB cable (if you have one)"],
      how: [
        "If you are using a USB hub or an extension cable, remove it and connect the device directly to the PC. A hub can be a cause of an external drive not being detected, because it may not supply enough power.",
        "On a desktop, plug it into a USB port wired directly to the motherboard on the back of the PC. These are in the area where the LAN port and audio jacks are grouped. They are often more stable than the front ports.",
        "On a laptop, try the other USB ports on the left and right sides. The power supplied can differ from port to port.",
        "If you have another USB cable, swap it in. A cable that is long or old can make detection unstable.",
        "For an external hard drive, also try swapping between a USB 3.0 port (blue) and a 2.0 port. Sometimes it works on only one of them.",
        "Each time you swap, check whether the device is detected (whether it appears in File Explorer).",
      ],
    },
    diskMgmt: {
      t: "Check whether the device shows in Disk Management",
      tools: [],
      how: [
        "Press the Windows key + R to open the Run box, type diskmgmt.msc and click OK. The \"Disk Management\" window opens.",
        "In the disk list at the bottom of the window, check whether the connected device is shown (Disk 1, Disk 2 and so on). You can guess which one it is from the capacity.",
        "If it shows but has no drive letter, right-click that volume area and choose \"Change Drive Letter and Paths\" to assign a letter.",
        "If it shows as \"Not Initialized\" or \"Unallocated\", it may be a new disk or a disk that holds data. Do not click Initialize or Format; go to the next step.",
        "If it does not show in Disk Management at all, the device is not being detected by the PC. Move on to the next step.",
      ],
      note: "Even if a message asks \"Do you want to format it?\" or tells you to initialize, do not click it if you need the data. Formatting erases the data.",
    },
    deviceMgr: {
      t: "Check Device Manager for warning marks",
      tools: [],
      how: [
        "Right-click the Start button and open \"Device Manager\".",
        "Expand \"Disk drives\" and \"Universal Serial Bus controllers\".",
        "Look for an item with a yellow exclamation mark, or an \"Unknown device\". Also watch whether the list changes when you plug the device in.",
        "Right-click an item with a warning and choose \"Uninstall device\". This does not erase the data on the storage device.",
        "Unplug the device and plug it back in, and check whether it is installed again automatically.",
        "If that does not help, restart the PC and then plug the device in.",
      ],
    },
    otherPc: {
      t: "Connect it to another PC to tell whether the device itself is the problem",
      tools: ["Another PC or laptop"],
      how: [
        "Connect the same device to another PC or laptop. If you use the same cable, the cable is checked at the same time.",
        "Check whether it is detected in File Explorer and in Disk Management (diskmgmt.msc).",
        "If it is not detected on the other PC either, the device (the disk, the cable or the external enclosure) is the likely cause.",
        "If it is detected on the other PC, the likely cause is the port, driver or settings of your current PC.",
        "If it was detected, back up the data first. After that, note which PC it was seen on and how.",
      ],
    },
  };

  const NODES = {
    start: {
      q: "What is the problem?",
      hint: "If your data is at stake, do not click any format or initialize prompt; follow this tool instead.",
      options: [
        { t: "An external hard drive or USB stick is not detected", icon: "usb", next: "r_ext" },
        { t: "An internal SSD or HDD is missing, even in the BIOS", icon: "drive", next: "r_int" },
        { t: "The C: drive is running out of space", icon: "pie", next: "r_cfull" },
        { t: "I deleted a file by mistake, or a file won't open", icon: "trash", next: "r_data" },
        { t: "I try to delete a file and it says it is open in another program", icon: "lock", next: "r_inuse" },
        { t: "A hard disk (HDD) makes a clicking or grinding noise", icon: "drive", next: "r_noise" },
        { t: "Task Manager keeps showing 100% disk usage and the PC is slow", icon: "pulse", next: "r_disk100" },
        { t: "Windows says \"You need to format the disk before you can use it\"", icon: "block", next: "r_format" },
        { t: "Copying to an external drive or USB stops or is very slow", icon: "clock", next: "r_slowcopy" },
        { t: "A drive appears and disappears, or its drive letter changes", icon: "usb", next: "r_letter" },
        { t: "Disk Management shows \"Not Initialized\" or \"Unallocated\"", icon: "drive", next: "r_uninit" },
        { t: "An SD card or memory card is not detected", icon: "usb", next: "r_card" },
        { t: "I try to safely remove external storage and it says it is in use", icon: "lock", next: "r_eject" },
        { t: "I want to check whether my SSD is healthy", icon: "pulse", next: "r_ssd" },
      ],
    },
    r_ext: {
      mode: "remote",
      title: "For external storage, sort it out in the order of port, Disk Management, another PC",
      lead: "If an external hard drive or USB stick does not show up, work through the port or cable, the drive letter, a shortage of power and the device itself, in that order.",
      warn: "Even if a message asks \"Do you want to format it?\", do not format if you need the data. If you hear repeated clicking, switch the power off and ask a professional.",
      steps: [S.portTest, S.diskMgmt, S.deviceMgr, S.otherPc, LIMIT("If it still does not show, or the data is important, it is safer not to touch the data and to ask a professional to check it.")],
    },
    r_int: {
      mode: "visit",
      title: "If an internal disk is missing, look first at BIOS detection and the connections",
      lead: "If an internal SSD or HDD does not show in Windows, first tell whether it is a connection problem or a disk problem by checking whether it shows in the BIOS.",
      steps: [S.biosDisk, S.diskCables, S.otherPc, LIMIT("If it is not seen even in the BIOS, or it makes strange sounds, the disk itself or the motherboard may be at fault, so it is safer to hand it over. If there is important data, ask before you format or reinstall.")],
    },
    r_cfull: {
      mode: "remote",
      title: "For C: drive space, see what is taking it up and clean it out",
      lead: "When the C: drive is full, the PC gets slow and updates can fail. Check the items that take the most space and clean them up.",
      steps: [
        {
          t: "Check what is taking up space in Storage",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Storage.",
            "The usage of the C: drive is shown by category (Apps, Temporary files, Documents, Pictures and so on). Click the largest category to see the details.",
            "Click \"Temporary files\" and tick the items that are safe to delete (Recycle Bin, temporary files and so on). First check that the Downloads folder has nothing you need.",
            "Click \"Remove files\" to delete them.",
            "After deleting, check how much the free space has grown.",
          ],
        },
        {
          t: "Clean up system files with Disk Cleanup",
          tools: [],
          how: [
            "Type \"Disk Cleanup\" in the Start menu search, run it and select the C: drive.",
            "Click the \"Clean up system files\" button to make it scan once more. It may need administrator permission.",
            "In the list, select items such as \"Temporary files\", \"Windows Update Cleanup\" and \"Previous Windows installation(s)\".",
            "Delete the previous Windows installation files only when you will not need to go back to the older version. Once deleted, you cannot roll back.",
            "Click OK, then \"Delete Files\" to continue.",
          ],
        },
        {
          t: "Turn on Storage Sense and turn off hibernation",
          tools: [],
          how: [
            "In Settings > System > Storage, turn on \"Storage Sense\" so temporary files are cleaned up automatically.",
            "First check that you do not use hibernation. Laptops often use hibernation, so check whether you do before you do this.",
            "If you do not use it, right-click the Start button, open \"Terminal (Admin)\", type powercfg /hibernate off and press Enter.",
            "This command removes the hiberfil.sys file (usually several GB) and frees the space. To use hibernation again, run powercfg /hibernate on.",
            "On the Storage screen, check how much the free space has grown.",
          ],
        },
        {
          t: "Move large files and folders to another drive",
          tools: ["Another drive with free space, or an external storage device"],
          how: [
            "In File Explorer, look at the folders that take a lot of space (videos, games, photos). You can also see the size of each category in Settings > System > Storage.",
            "Move large files you rarely use to an external storage device or another drive (such as D:). Do not move the folders where programs are installed (Program Files); move ordinary files only.",
            "Copy them over first. If you use \"move\" and something goes wrong halfway, the original can be lost.",
            "After moving, check that the files open normally in the new location.",
            "If they do, delete the originals.",
          ],
        },
        LIMIT("If the space is fundamentally too small, you need an SSD capacity upgrade, so it is safer to hand it over. Moving your data over can be arranged at the same time."),
      ],
    },
    r_data: {
      mode: "remote",
      title: "If data is at stake, the most important thing is to stop using the drive",
      lead: "For a deleted file or one that won't open, the more you save to or install on that drive, the harder recovery can become. First stop writing to it, then check the routes by which the data can be recovered.",
      warn: "If the data is important, do not install programs on that drive or save new files to it. Even a recovery program must be installed on a different drive.",
      steps: [
        {
          t: "Check the Recycle Bin and the cloud Recycle Bin",
          tools: [],
          how: [
            "Double-click the Recycle Bin icon on the desktop to open it.",
            "Look for the deleted file by name or date. Right-click the file and choose \"Restore\" to return it to its original place.",
            "If you use a cloud such as OneDrive or Google Drive, also check the trash on that service's website. The retention period is limited (for example 30 days), so check quickly.",
            "Check that the restored file opens normally in its original place.",
            "After restoring, make a backup so the same file is not deleted again.",
          ],
        },
        {
          t: "Restore from a previous version or a backup",
          tools: [],
          how: [
            "Right-click the file or folder and open \"Properties\".",
            "On the \"Previous Versions\" tab, see whether there are restore points. A list appears only if File History or System Protection was turned on.",
            "Choose the version to restore and click \"Restore\". It is safer to click \"Copy\" first to copy it to another place.",
            "If you turned on Windows Backup or an external drive backup, restore from that location.",
            "If this does not work, stop writing anything more to that drive and go to the next step. Saving new files can overwrite the deleted data.",
          ],
        },
        S.smart,
        LIMIT("Trying recovery software yourself can make the condition worse. If the data is important, it is safer to ask for professional data recovery."),
      ],
    },
    r_inuse: {
      mode: "remote",
      title: "If it won't delete, find the program that is using it and close it",
      lead: "\"The action can't be completed because the file is open in another program\" means some program is holding the file. Closing that program or restarting often releases it.",
      steps: [
        {
          t: "Close open programs and restart File Explorer",
          tools: [],
          how: [
            "Close every program that might have the file open (a document editor, a video player, an archive program and so on).",
            "Open Task Manager with Ctrl+Shift+Esc. If it opens small, click \"More details\".",
            "On the \"Processes\" tab, right-click \"Windows Explorer\" and click \"Restart\". The taskbar disappears for a moment and then comes back.",
            "If the \"Preview pane\" in File Explorer (View > Show) is on, turn it off. The preview can be holding the file.",
            "Try deleting the file again.",
          ],
        },
        {
          t: "Restart and delete it right away",
          tools: [],
          how: [
            "Save any open work and choose Start > Power > \"Restart\". Restart is more reliable than \"Shut down\".",
            "After the restart, before you open any other program, go straight to the folder that holds the file.",
            "Select the file and delete it.",
            "If a program you had open starts automatically, turn it off in Settings > Apps > Startup and try again.",
          ],
        },
        {
          t: "Delete it in Safe Mode",
          tools: [],
          how: [
            "Save any document you are working on. Open Settings > System > Recovery.",
            "Next to \"Advanced startup\", click \"Restart now\". A blue selection screen appears.",
            "Click \"Troubleshoot\" → \"Advanced options\" → \"Startup Settings\" → \"Restart\" in turn.",
            "After the restart, press 4 (or F4) in the \"Startup Settings\" list to enter Safe Mode.",
            "Delete the file in Safe Mode.",
            "After deleting, restart the PC to return to normal mode.",
          ],
        },
        {
          t: "Scan with Windows Security",
          tools: [],
          how: [
            "Type \"Windows Security\" in the Start menu search and open it.",
            "Click \"Virus & threat protection\".",
            "Click \"Scan options\", choose \"Full scan\" and click \"Scan now\".",
            "A full scan takes a long time, so leave the PC on and wait.",
            "Malicious software can be the one holding the file, which is why the scan is needed. If a threat is found, remove it as instructed.",
          ],
        },
      ],
    },
    r_noise: {
      mode: "visit",
      title: "Clicking can be a sign of failure, so back up first",
      lead: "A hard disk (HDD) has moving parts inside, so a steady hum or the sound of waking from sleep can be normal. But a regularly repeating \"click-click\" or a grinding noise that suddenly gets louder is closer to a failure sign. An SSD has no moving parts and does not make this noise.",
      warn: "If the clicking keeps repeating, back up your important files before diagnosing. Switch the power on and off as little as you can, and do not take the disk apart yourself.",
      steps: [
        {
          t: "Tell the kind of sound apart",
          tools: [],
          how: [
            "A steady hum, or the sound when the disk wakes from sleep, is usually the normal working sound.",
            "A \"click-click\" that repeats at regular intervals can be the head failing to find its position and retrying again and again. If you hear it, copy your important files to another storage device or the cloud right away.",
            "A grinding noise that suddenly gets louder is also closer to a failure sign. Stop using the disk, back up, then ask for help.",
            "A single \"click\" only now and then, once every few minutes, may be the head moving to a safe position when the disk is idle (head parking). Still, if File Explorer freezes or files open slowly while the sound happens, back up first.",
          ],
        },
        {
          t: "If only an external drive clicks, try another USB port",
          tools: ["Another USB cable (if you have one)"],
          how: [
            "A 2.5-inch external drive that gets its power only from the USB port can click repeatedly and its drive letter can appear and disappear when the power runs short at the moment it spins up.",
            "Remove any hub or extension cable and plug it straight into a port on the back of a desktop. A hub with its own power supply is another option.",
            "If the sound stops after changing the port, the cause is more likely a power supply problem than a failed disk.",
            "If it keeps clicking at the same beat even after changing the port, treat it as a head-side failure like an internal drive and back up first.",
          ],
        },
        {
          t: "Check the mounting screws and cables touching",
          tools: [DRV],
          needs: OPEN_DESKTOP,
          how: [
            SAFE_OFF,
            "Open the side panel and check that the hard disk's mounting screws are not loose. Tighten them if they are.",
            "Check that no cable is touching another part and vibrating. If one is, tidy its position.",
            "Plug the power cord back in, switch on, and see whether the noise has dropped. If vibration caused it, it will drop.",
          ],
        },
        S.smart,
        LIMIT("If the regular clicking continues, or the data is important, it is safer to use the disk less and ask a professional about recovery. Do not take the hard disk apart yourself."),
      ],
    },
    r_disk100: {
      mode: "remote",
      title: "100% disk usage does not mean the storage space is full",
      lead: "The 100% disk usage in Task Manager means all the time the disk can spend on work is being used. Normal jobs such as Windows Update, search indexing and antivirus scans can also raise it for a while, so you should not replace the disk because of that one number. First find out which program is using the disk.",
      steps: [
        {
          t: "Find which program is using the disk in Task Manager",
          tools: [],
          how: [
            "Press Ctrl+Shift+Esc to open Task Manager. If it opens small, click \"More details\".",
            "On the \"Processes\" tab, click the \"Disk\" column header to sort by the heaviest use.",
            "Watch for about 10 minutes and note the program names and when the usage drops.",
            "Work that has a clear reason, such as an update or antivirus scan, drops when it finishes. If it stays at 100% for no reason, go to the next step.",
          ],
        },
        {
          t: "Tell which disk is at 100%",
          tools: [],
          how: [
            "On the \"Performance\" tab of Task Manager, check the graph of each disk in the left list, such as \"Disk 0 (C:)\" and \"Disk 1 (D:)\".",
            "If the one at 100% is an external USB drive or a secondary data disk and the C: drive is idle, the cause is more likely a backup, sync, video playback or virus scan using that disk than a system drive problem.",
            "In that case, look first at the programs using that disk and at the state of the USB cable and port.",
          ],
        },
        {
          t: "Check free space and memory use",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Storage, check the free space on the C: drive and clean up temporary files.",
            "On the \"Performance\" tab of Task Manager, open \"Memory\" and see whether use is above 90%. If space on the system drive or memory runs short, use of the page file (virtual memory) grows and the disk can stay busy.",
          ],
        },
        S.smart,
        LIMIT("Do not switch off several Windows services at once without knowing the cause. If 100% lasts for tens of minutes or more and there are SMART warnings or disk error records, back up first and ask for a check."),
      ],
    },
    r_format: {
      mode: "remote",
      title: "Even if it asks you to format, do not click it if you need the data",
      lead: "A message such as \"You need to format the disk before you can use it\" can appear when Windows cannot recognize the file system of the storage device. Formatting erases the data, so if you need it, first check the device and the state of the data.",
      warn: "If you need the data, do not press the Format button. Also stop saving anything new to that drive or installing programs on it.",
      steps: [S.otherPc, S.diskMgmt, S.smart, LIMIT("If another PC also asks you to format and the data is important, it is safer not to try recovery yourself and to ask a professional about recovery.")],
    },
    r_slowcopy: {
      mode: "remote",
      title: "If copying is slow or stops, separate the port, cable and power from the device itself",
      lead: "When copying to external storage slows down sharply or stops, separate the port or cable, a shortage of power through a hub, and the state of the device itself. A folder with a huge number of small files can take longer than the same amount of data in one file, so compare the speed with one large file.",
      warn: "If you hear noises or it stops several times while copying, do not keep repeating the copy. It can make things worse. Move the important files first.",
      steps: [
        {
          t: "Compare the copy speed with one large file",
          tools: [],
          how: [
            "Copy one large file (such as a video) to the same device and time how long it takes.",
            "A folder with a huge number of small files can take longer even at the same size, so if you were moving a whole folder, compare it with one large file.",
            "Check whether the speed keeps dropping or it stops partway even with the large file.",
            "Note whether File Explorer also stops responding when it stops. It helps when you ask for help.",
          ],
        },
        S.portTest,
        S.otherPc,
        S.smart,
        LIMIT("If the symptom stays the same after changing the port and cable, and there are SMART warnings or noises, it may be the state of the device. If the data is important, it is safer not to repeat it yourself and to ask for help."),
      ],
    },
    r_letter: {
      mode: "remote",
      title: "A drive that appears and disappears: check power, connection and device state first",
      lead: "A drive that is detected on some starts and not on others, or whose drive letter disappears, can be a USB power shortage or a poor connection, and can also be a sign of an unstable storage device. Before sorting out the cause, it is safer to move your important files first.",
      warn: "While the drive shows, copy your important files somewhere else first. Working for long on an unstable device, or plugging it in and out repeatedly, can make things worse.",
      steps: [S.portTest, S.diskMgmt, S.smart, S.otherPc, LIMIT("If it keeps appearing and disappearing on other ports and other PCs too, and the data is important, it is safer to ask for a check than to handle it yourself.")],
    },
    r_uninit: {
      mode: "remote",
      title: "\"Not Initialized\" may be a new disk, or a disk that holds data",
      lead: "A disk shown as \"Not Initialized\" or \"Unallocated\" in Disk Management may be a brand-new empty disk, or a disk that holds data whose structure Windows cannot read. Until you know which, do not click initialize or format.",
      warn: "If the disk held data, do not \"Initialize\" it or create a \"New Simple Volume\". Go ahead only when you are sure it is a brand-new empty disk with no data.",
      steps: [S.diskMgmt, S.otherPc, S.smart, LIMIT("If a disk that held data keeps showing like this, it is safer not to try recovery yourself and to ask a professional about recovery.")],
    },
    r_card: {
      mode: "remote",
      title: "For an SD or memory card, check the lock switch and the reader first",
      lead: "If a card used in a camera or dashcam is not shown on the PC, work through the card's lock switch, the card reader and port, and the card itself, in that order. Even if a message asks you to format, do not click it if you need the photos or videos.",
      warn: "If the card holds photos or videos, do not format it, and do not save anything new to it.",
      steps: [
        {
          t: "Check the card's lock switch and the reader",
          tools: ["Another card reader (if you have one)"],
          how: [
            "An SD card with a small lock switch on its side can block writing when the switch is in the locked position. Slide the switch the other way.",
            "Re-insert the card slowly. If there is dust or a fingerprint on the gold contacts, wipe them with a dry cloth.",
            "If you use the built-in slot of a laptop, try a USB card reader. If you already use a reader, plug it into another USB port.",
            "Check whether it shows when you change the reader.",
          ],
        },
        S.diskMgmt,
        S.otherPc,
        LIMIT("If it does not show on another reader or PC either, and the card holds precious photos, it is safer to stop using the card and ask a professional about recovery."),
      ],
    },
    r_eject: {
      mode: "remote",
      title: "If removal says \"in use\", close the programs using it, or shut down and then unplug",
      lead: "If Safely Remove fails and says the device is in use, some program has files open on it. Pulling it out anyway can damage the files, so close the programs or shut the PC down and then unplug it.",
      warn: "Do not pull it out while it is copying or its light is blinking. The files can be damaged.",
      steps: [
        {
          t: "Close open programs and restart File Explorer",
          tools: [],
          how: [
            "Close every program that may have files open on that device (video player, document editor, photo app, backup or sync program).",
            "Close any File Explorer window that has that drive open.",
            "Press Ctrl+Shift+Esc to open Task Manager, right-click \"Windows Explorer\", then choose \"Restart\".",
            "Use the \"Safely Remove Hardware\" icon in the taskbar and choose \"Eject\" again.",
          ],
        },
        {
          t: "Shut the PC down and then unplug it",
          tools: [],
          how: [
            "Save your open work, then choose Start > Power > \"Shut down\".",
            "After the PC is completely off, unplug the device. With the PC shut down, no program is using it.",
            "If this happens often, check the settings of backup or sync programs and antivirus, in case one keeps using the device.",
          ],
        },
        LIMIT("If files will not open or the device is not detected after you pulled it out, it is safer not to touch the data and to ask for help."),
      ],
    },
    r_ssd: {
      mode: "remote",
      title: "Check SSD health with the SMART values",
      lead: "For an SSD, the health status and the amount written (TBW) are clues to its lifespan. If something looks wrong, protect your data first and plan a replacement.",
      steps: [
        S.smart,
        {
          t: "Interpret it with this site's SSD health check tool",
          tools: ["The SSD information from a program such as CrystalDiskInfo (it can be copied as text)"],
          how: [
            "Run CrystalDiskInfo and open the SSD information screen.",
            "From the menu, choose \"Edit\" → \"Copy\" to copy the SSD information.",
            "Open this site's SSD health check tool and paste the copied text into the input box. What you enter is processed only in your browser.",
            "Read the verdict and the recommended action.",
            "The criteria are explained on the tool's page. A screenshot of the result helps if you ask someone for help.",
          ],
        },
        {
          t: "Back up your important data",
          tools: ["An external storage device or cloud storage to back up to"],
          how: [
            "First decide the list of data to back up (photos, documents, work files).",
            "Prepare an external storage device or cloud storage (OneDrive, Google Drive and so on) and copy the data over.",
            "Do not keep the same data in only one place; keep one more copy on another device.",
            "Open a few of the backed-up files to check that they open normally.",
            "If copying from the problem device makes noises or stops, stop and do not try further. Forcing it again and again can make the condition worse.",
          ],
        },
      ],
      guides: [{ href: "/en/ssd-health-check.html", t: "SSD health check tool" }],
    },
  };

  window.ITSVC_WIZARD = { nodes: NODES };

  // Per-step notes (c: cause candidate, m: rough time, l: difficulty, w: why, r: how to read the result, t: site tool key).
  // The time is a rough estimate based on the kind of task, not a measurement.
  window.ITSVC_WIZARD_META = Object.assign(window.ITSVC_WIZARD_META || {}, {
    "Plug it straight into another USB port (on the back of the PC)": { c: "USB port, hub or cable problem", m: "About 5 min", l: "Easy", w: "The port, hub or cable is often the problem. Plugging straight into a port on the back of the PC is the most reliable way to check.", r: "If it is detected on another port → it was the port or hub." },
    "Check whether the device shows in Disk Management": { c: "No drive letter assigned", m: "About 5 min", l: "Moderate", w: "Disk Management shows how Windows sees the device. Sometimes a device does not appear simply because it has no drive letter.", r: "If the device shows but has no letter → assign a letter and it will appear." },
    "Check Device Manager for warning marks": { c: "USB or disk driver problem", m: "About 10 min", l: "Easy", w: "A yellow exclamation mark means there is a problem with the driver. Removing it and letting Windows detect it again sometimes clears it.", r: "If the warning disappears and the device is detected → it was a driver problem." },
    "Connect it to another PC to tell whether the device itself is the problem": { c: "The storage device itself has failed", m: "About 10 min", l: "Easy", w: "If it does not show on another PC either, the storage device itself is the problem. If it fails only on your PC, the cause is that PC's port or settings.", r: "If it fails on the other PC too → the device itself is likely faulty." },
    "Check whether the disk shows up in the BIOS": { c: "Disk detection problem", m: "About 5 min", l: "Moderate", w: "If the disk is missing even before Windows starts, it is a connection or disk problem. The BIOS is the yardstick that tells them apart.", r: "If it is missing in the BIOS too → a connection fault or a failed disk." },
    "Check the disk connections and re-seat them": { c: "Poor disk cable contact", m: "About 15 min", l: "Moderate", w: "A loose disk cable makes detection come and go. Re-seat it or swap in another cable.", r: "If it shows after re-seating → it was a poor contact." },
    "Check what is taking up space in Storage": { c: null, m: "About 5 min", l: "Easy", w: "You can only reduce what is using the space once you know what it is. This shows the usage by category.", r: "If one category is unusually large → clean that one up first." },
    "Clean up system files with Disk Cleanup": { c: "Leftover temporary and update files", m: "About 15 min", l: "Easy", w: "Windows Update leftovers and temporary files are safe to delete but can take up a lot of space.", r: "If the free space grows after cleanup → leftover files were the cause." },
    "Turn on Storage Sense and turn off hibernation": { c: "Piled-up temporary files, hibernation file", m: "About 5 min", l: "Moderate", w: "This makes Windows clean up temporary files automatically, and removes the hibernation file (a large one) if you do not use it.", r: "If several GB are freed → these files were taking the space." },
    "Move large files and folders to another drive": { c: "Piled-up large files", m: "30+ min", l: "Easy", w: "If cleaning is not enough, moving large files elsewhere is the surest way. Move files only, not program folders.", r: "If space frees up after moving → the space problem is solved." },
    "Check the Recycle Bin and the cloud Recycle Bin": { c: "File still in the Recycle Bin", m: "About 5 min", l: "Easy", w: "A deleted file may still be in the Recycle Bin. If you use a cloud service, it may also be in that service's trash.", r: "If you find it in the Recycle Bin → one restore finishes it." },
    "Restore from a previous version or a backup": { c: "Restore from a backup or previous version", m: "About 10 min", l: "Easy", w: "Windows sometimes keeps \"Previous Versions\" or backups. If you turned them on, you can bring the file back from there.", r: "If a previous version exists → you can restore to that point." },
    "Check the storage device's health (SMART)": { c: "Worn-out or failing storage device", m: "About 10 min", l: "Easy", w: "This is health information the storage device records about itself. It shows whether slowness is due to the disk wearing out.", r: "If it says \"Caution\" or \"Bad\", or there are pending sectors → the disk is worn. Back up your data first.", t: "ssd" },
    "Close open programs and restart File Explorer": { c: "A program is using the file", m: "About 5 min", l: "Easy", w: "\"In use\" means some program is holding the file. Closing that program releases it.", r: "If it deletes after closing → that program was holding it." },
    "Restart and delete it right away": { c: "Temporary file lock", m: "About 5 min", l: "Easy", w: "Restarting clears every program that was holding the file. Deleting it before other programs start usually works.", r: "If it deletes right away → it was only temporarily held." },
    "Delete it in Safe Mode": { c: "A background program is holding the file", m: "About 15 min", l: "Moderate", w: "Safe Mode runs only what is needed, so almost no program holds the file. Even stubborn files can be deleted.", r: "If it deletes in Safe Mode → a program that normally runs was holding it." },
    "Scan with Windows Security": { c: "Malicious software is holding the file", m: "30+ min", l: "Easy", w: "Malicious software can be what is holding the file, so a scan rules it out.", r: "If a threat is found → remove it and try again." },
    "Interpret it with this site's SSD health check tool": { c: "SSD health problem", m: "About 10 min", l: "Easy", w: "If you put the SSD information copied from the program into this site's tool, it interprets the health for you. If the numbers are hard to read, the tool explains them.", r: "If the verdict is \"Caution\" → back up and plan a replacement.", t: "ssd" },
    "Back up your important data": { c: null, m: "30+ min", l: "Easy", w: "A disk or SSD can fail at any time, so important data is safest when it exists in two or more places.", r: "If the backed-up files open → you can relax." },
  });
})();
