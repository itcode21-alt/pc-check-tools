// English editions of the most-searched Windows event explanations (pilot).
//
// Every entry is a faithful translation/condensation of the Korean page named in `ko`
// (itself written from Microsoft documentation and field checks) — no new technical
// claims are introduced here. Keep it that way: when the Korean page changes, update
// the English text, and only add an event after its Korean page has been verified.
//
// slug → file en/event-<slug>.html. `related` lists other slugs in this file.

const MS = "Microsoft Learn";
const WINEVENT = ["https://learn.microsoft.com/powershell/module/microsoft.powershell.diagnostics/get-winevent", `${MS}: Get-WinEvent`];

export const eventEn = {
  "kernel-power-41": {
    ko: "event-kernel-power-41.html",
    source: "Kernel-Power", id: "41", area: "Power & shutdown",
    title: "Kernel-Power Event 41: Causes and What to Check",
    desc: "Kernel-Power 41 means Windows started after it could not finish a normal shutdown. It is a result, not a cause: do not blame the PSU from this event alone.",
    lead: "Kernel-Power 41 is a result record: Windows booted after the previous session ended without a normal shutdown. It does not say why.",
    body: [
      "A power cut, holding the power button on a frozen PC, an automatic reboot after a blue screen, overheating and unstable power can all produce the same event. Replacing the power supply based on this record alone can mean swapping a healthy part and missing the real cause.",
      "In Event Viewer the event shows level “Critical”. That label by itself tells you nothing about the cause; read the Details tab (BugcheckCode and related fields) as well."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If the screen froze and you switched the PC off yourself, event 41 is probably the result of that forced shutdown. Look at the app and driver that were running when it froze.",
        "If power vanished instantly, check the PSU, the 24-pin, EPS and GPU power connectors, the power strip, and temperatures first.",
        "If the PC rebooted after a blue screen, look at BugCheck 1001 at the same time and at the dump file."
      ]]
    ],
    conditions: ["Unexpected power-off or restart", "Automatic reboot after a blue screen", "Forced power-off with the power button"],
    causes: ["Power loss or unstable power delivery", "Overheating", "Kernel or driver crash followed by reboot", "Forced shutdown by the user"],
    checks: [
      "Back up open files, then note the time of the event and what the PC was doing.",
      "On the Details tab of event 41, check whether BugcheckCode is 0, then look at WHEA-Logger and Display events in the 5 minutes before it.",
      "Compare CPU/GPU temperatures and power-limit flags from a tool such as HWiNFO.",
      "With the PC off, re-seat the 24-pin ATX, CPU EPS and GPU power connectors and check the PSU modular cables.",
      "Reset XMP/EXPO and any overclock to defaults and see whether the same workload still reproduces it."
    ],
    caution: [
      "Do not buy a PSU or edit registry values based on event 41 alone. Whether it also happens at idle, only in one game, or together with WHEA 18 or Display 4101 is a much better clue.",
      "Burning smell, discoloured cables, repeated instant power-offs or power loss while saving: reduce use, back up, and check the power path first."
    ],
    faqs: [
      ["Does Kernel-Power 41 always mean a bad power supply?", "No. It only records that Windows restarted without a normal shutdown and does not identify the cause. A blue screen followed by automatic reboot, or holding the power button, leaves the same event. Before suspecting the PSU, work out whether the screen froze or the machine switched off completely."],
      ["It is logged even though there was no blue screen — is that possible?", "Yes. If the PC simply switched off and rebooted with no error on screen, event 41 is still logged. BugcheckCode is then 0, meaning power was cut before Windows could write a stop code, so check the power path and cooling first."],
      ["Can it happen on laptops?", "Yes: battery or adapter problems, thermal shutdown and sleep-transition errors can all log it. On a laptop, also check battery health and the charger contact."]
    ],
    refs: [
      ["https://learn.microsoft.com/troubleshoot/windows-client/performance/event-id-41-restart", `${MS}: Kernel-Power event 41`],
      ["https://learn.microsoft.com/troubleshoot/windows-server/performance/troubleshoot-unexpected-reboots-system-event-logs", `${MS}: Analyze logs for unexpected reboots`]
    ],
    related: ["eventlog-6008", "user32-1074", "bugcheck-1001", "whea-logger-18"]
  },

  "eventlog-6008": {
    ko: "event-eventlog-6008.html",
    source: "EventLog", id: "6008", area: "Power & shutdown",
    title: "EventLog Event 6008: Unexpected Shutdown Explained",
    desc: "EventLog 6008 records that the previous shutdown ended in an unexpected way. It is an after-the-fact result, not a cause; compare it with Kernel-Power 41.",
    lead: "6008 is an after-the-fact report that the previous system shutdown ended unexpectedly. It does not contain the cause.",
    body: [
      "Kernel-Power 41 often records the same moment from the boot side, so compare the two rather than judging from one. If you do not remember a blue screen or forced shutdown yet it keeps repeating, check whether it coincides with a sleep transition or an automatic update reboot. Whether you actually suffered damage (corrupt or unsaved files) decides whether action is needed."
    ],
    sections: [
      ["6008 is a result, not a cause", [
        "The event only says the previous shutdown did not follow the normal procedure. Use the shutdown time written in its description and look at the other records in the few minutes before it.",
        "Kernel-Power 41 — the same incident seen from the boot side.",
        "BugCheck 1001 — if there was a blue screen, the stop code is recorded there.",
        "WHEA-Logger — a hardware error cause would be logged there."
      ]],
      ["If it clusters right after reboots", [
        "If Kernel-Power 41 appears the same number of times and storage errors (Ntfs 98/55/140, Disk 51) are clustered right after the reboots, the storage may not be the cause: a sudden power loss can leave NTFS unable to finish a write, and the traces show up at the next boot.",
        "If BugcheckCode in event 41 is 0 and there is no blue-screen record or WHEA-Logger entry in that period, power was cut rather than the system crashing — check the power path first, because repeated disk checks will not stop the damage from recurring."
      ]]
    ],
    conditions: ["After a power cut or forced shutdown", "Automatic reboot after a blue screen", "Power button used after a freeze"],
    causes: ["An abnormal-shutdown result", "Interrupted power supply", "Kernel or driver hang"],
    checks: [
      "Write down the previous shutdown time given in the description; every later check is relative to it.",
      "In Event Viewer, narrow to a few minutes around that time and look at Error/Critical records: BugCheck 1001, WHEA-Logger and Disk events point to the cause.",
      "Open Reliability Monitor (Control Panel → View reliability history) for a day-by-day overview of failures.",
      "If only 6008 remains with nothing before it, power may have dropped instantly: connect directly to a wall outlet instead of a strip and check the 24-pin and auxiliary connectors."
    ],
    caution: ["It is usually the record of a shutdown result, not of the cause."],
    faqs: [
      ["Which should I check first, 6008 or Kernel-Power 41?", "They record the same shutdown in different ways, so neither has priority. Looking at both timestamps together with nearby hardware events helps more than either alone."],
      ["It repeats but nothing seems wrong. Is that OK?", "If you notice no problem there is no need to act urgently. If you remember power dropping while saving, or force-shutting down after a freeze, look at that cause first."]
    ],
    refs: [],
    related: ["kernel-power-41", "user32-1074", "bugcheck-1001", "whea-logger-18"]
  },

  "user32-1074": {
    ko: "event-user32-1074.html",
    source: "User32", id: "1074", area: "Power & shutdown",
    title: "User32 Event 1074: Planned Shutdown or Restart",
    desc: "User32 1074 is logged when a user or a process requests a Windows shutdown or restart. Check the requesting process and reason before assuming anything is wrong.",
    lead: "1074 is an information record written when Windows receives a shutdown or restart request. Unlike Kernel-Power 41 it does not mean power was cut abruptly.",
    body: [
      "Windows Update or an installer requesting a restart can be perfectly normal. If an unexpected process keeps requesting restarts, compare recently installed software and the Security log."
    ],
    conditions: ["Automatic restart after Windows Update", "Shutdown from the Start menu or the shutdown command", "A management tool or installer requesting a reboot"],
    causes: ["Shutdown by the user", "Windows Update or an installer", "A shutdown request sent by WMI or a management tool"],
    checks: [
      "Record the process, user and Reason Code from the description.",
      "Compare with Windows Update and installer events at the same time.",
      "Check whether an actual reboot followed 1074 by comparing times with 6008 and Kernel-Power 41."
    ],
    caution: ["1074 is a record of a planned shutdown request. Do not conclude from it alone that a shutdown was unwanted or malicious."],
    faqs: [
      ["Does 1074 mean the PC is broken?", "No. A user shutdown or restart, or Windows Update, also writes 1074. Compare the process name and time with what you actually did."],
      ["Should I look at 1074 together with Kernel-Power 41?", "Yes. 1074 shows who requested the shutdown; 41 shows that it did not end normally. Comparing the times helps separate a planned restart from a sudden power loss."]
    ],
    refs: [],
    related: ["eventlog-6008", "kernel-power-41"]
  },

  "application-error-1000": {
    ko: "event-application-error-1000.html",
    source: "Application Error", id: "1000", area: "Applications & services",
    title: "Application Error Event 1000: When an App Keeps Crashing",
    desc: "Application Error 1000 is logged when a program terminates on an unhandled exception. Record the faulting application, faulting module and exception code to narrow the cause.",
    lead: "When a program ends because of an exception it did not handle, event 1000 can appear in the Application log.",
    body: [
      "The key fields are the faulting application name, faulting module name, exception code and fault offset. If the application and module are the same, look at the application files themselves; if a graphics-driver DLL or a shared runtime is shown, check the driver or component and whether other apps crash too."
    ],
    sections: [
      ["Reading the exception code", [
        "0xC0000005 means an invalid memory access, but it does not point to bad RAM alone: an application bug, a plug-in or a driver can cause it too. If 0x80070005 is also shown, check file/folder permissions and security software block logs."
      ]],
      ["Before you reinstall", [
        "Back up app data and settings, and test with a new Windows account to see whether only your profile is affected. Deleting program folders by hand, or downloading shared DLLs from the internet and overwriting them, can damage other apps."
      ]]
    ],
    conditions: ["An application suddenly closes", "A crash report dialog appears"],
    causes: ["A bug in the application or one of its plug-ins", "A graphics driver or shared runtime module", "Damaged files or permission problems", "Less often: unstable memory or storage"],
    checks: [
      "Record the app version, faulting module, exception code and what you were doing just before the crash.",
      "Compare whether only one app repeats or several apps crash with different modules.",
      "Repair or update the app, then retest with plug-ins and overlays turned off.",
      "If the module is a graphics one, compare a stable driver version and the hardware-acceleration setting.",
      "If random crashes continue across several apps, check memory, storage and system files."
    ],
    caution: ["If several apps crash with different faulting modules and you also see blue screens or file corruption, treat it as a system problem: check RAM, storage and stability first."],
    faqs: [
      ["Is exception code 0xC0000005 always a RAM problem?", "No. It means a bad memory address was accessed, but the cause may be an app bug, an incompatible plug-in or a damaged driver. RAM is only one possibility, so first separate “always the same app” from “random across apps”."],
      ["Many programs log event 1000 at once. What now?", "If different apps close with different faulting modules, it is more likely a system-wide problem than one app's bug. Run a memory test, and check storage health and recently installed shared runtimes or drivers."],
      ["How do 1000 and 1002 differ?", "1000 records an app terminated by an unhandled exception; 1002 records an unresponsive app that Windows closed (a hang). For 1000 look at the exception code and module; for 1002 look at when the hang began and how often it repeats."]
    ],
    refs: [WINEVENT],
    related: ["application-hang-1002", "kernel-power-41"]
  },

  "application-hang-1002": {
    ko: "event-application-hang-1002.html",
    source: "Application Hang", id: "1002", area: "Applications & services",
    title: "Application Hang Event 1002: Program Not Responding",
    desc: "Application Hang 1002 records a program that stopped responding for a while. Unlike a crash (1000), the process is still waiting, not terminated.",
    lead: "1002 is logged when a program stops responding for a period of time and Windows marks it as hung. Unlike Application Error 1000 the process was not ended by an exception.",
    body: [
      "Check which task the hang started in and whether the app recovered. If only one app repeats, look at its settings, plug-ins and overlays first; if several apps hang in the same time window, compare graphics driver, storage and memory usage."
    ],
    conditions: ["“Not responding” shown in the window title", "A game, File Explorer or document app freezes", "It recovers after a while or is force-closed"],
    causes: ["The app waiting on an internal task or plug-in", "Slow response from graphics, storage or network", "Overlay or security-software conflicts"],
    checks: [
      "Record the name of the hung app and the hang type.",
      "Compare whether it reproduces only in the same app.",
      "Turn off overlays and plug-ins, and retest from a clean boot.",
      "Check Disk, Display and Application Error events from the same time."
    ],
    caution: ["Do not conclude RAM or storage failure from 1002 alone. The app that hung and the conditions are better clues."],
    faqs: [
      ["Does 1002 mean the RAM is faulty?", "No. App-internal waiting, storage delay, graphics driver problems and plug-in conflicts can all cause it. First check whether it repeats randomly across several apps."],
      ["How do I tell 1000 and 1002 apart?", "1000 is an app ended by an unhandled exception; 1002 is a continuing not-responding state. For 1000 check the exception code and module; for 1002 check when the hang began, the task and how often it repeats."]
    ],
    refs: [],
    related: ["application-error-1000"]
  },

  "wer-1001": {
    ko: "event-wer-1001.html",
    source: "Windows Error Reporting", id: "1001", area: "Crashes & reports",
    title: "Windows Error Reporting Event 1001: What It Records",
    desc: "Windows Error Reporting 1001 means a blue screen, app crash or hardware error was registered with error reporting. Check the report type before assuming a blue screen.",
    lead: "1001 records that a blue screen, an app crash or a hardware error was filed as a report in Windows Error Reporting. The event itself does not mean a blue screen.",
    body: [
      "Read the Report Type in the details first. The event only records and does not fix anything, but noting the repeated report type and target program makes the same symptom much quicker to narrow down next time."
    ],
    sections: [
      ["1001 is a report-registration record", [
        "If the description contains BlueScreen or BugcheckCode, it is a blue screen — continue with the stop code.",
        "If a specific executable name is shown, it is an app crash; Application Error 1000 holds more detail on the module.",
        "The dump location shown in the event properties gives the real minidump path, so you can copy it and open it in WinDbg instead of searching C:\\Windows\\Minidump. The Report ID is also useful: if the same stop code repeats but the Report ID is new every time, the conditions behind it may differ each time, so compare how it reproduces before settling on one cause."
      ]]
    ],
    conditions: ["After an automatic reboot following a blue screen", "After an app crash report was created"],
    causes: ["A BugCheck", "An application failure", "A hardware error report"],
    checks: [
      "Identify the report type first: BlueScreen/BugcheckCode means a blue screen, an executable name means an app crash.",
      "For a blue screen, convert BugcheckCode to hexadecimal and look up the stop code. If a dump exists in C:\\Windows\\Minidump, it can narrow the cause to a driver.",
      "For an app crash, also look at Application Error 1000, which records the faulting module and exception code.",
      "Check %LOCALAPPDATA%\\CrashDumps for per-app dumps; attaching one helps when you contact the vendor."
    ],
    caution: ["Do not assume a blue screen before you have checked the report type."],
    faqs: [
      ["Does event 1001 mean there was a blue screen?", "No. Besides blue screens it can be recorded for app crashes or hardware error reports. The report type in the event details tells you which."],
      ["Can this event appear without a dump file?", "Yes. In some setups full memory-dump creation is disabled, yet the error report itself can still be recorded separately."]
    ],
    refs: [],
    related: ["bugcheck-1001", "application-error-1000"]
  },

  "bugcheck-1001": {
    ko: "event-bugcheck-1001.html",
    source: "BugCheck", id: "1001", area: "Crashes & reports",
    title: "BugCheck Event 1001: Blue Screen Details in the Log",
    desc: "BugCheck 1001 is written right after a blue screen and holds the stop code, its four parameters and the dump path — the first data to use in the analysis.",
    lead: "BugCheck 1001 is the record Windows leaves in the System log right after a blue screen (stop error). The stop code, four parameters and the dump file path are recorded together, so it is the first source for the analysis.",
    body: [
      "With the source BugCheck, event 1001 is written at the moment of the crash. Unlike Windows Error Reporting 1001 (a later report), it carries the stop code, the four parameters and the dump path itself.",
      "Look up the stop code in the General tab (for example 0x0000009c), or open the saved dump (C:\\Windows\\Minidump) in a crash-dump analysis tool to see which driver was involved."
    ],
    conditions: ["On reboot right after a blue screen", "After an unexpected system shutdown"],
    causes: ["A kernel crash caused by a driver or hardware error", "System halt due to unstable memory or power", "Unstable overclock or XMP/EXPO settings"],
    checks: [
      "Read the stop code (for example 0x0000009c) and the four parameters in the General tab.",
      "Compare WHEA-Logger and Kernel-Power events at the same time.",
      "Analyze the dump files in C:\\Windows\\Minidump with a dump analyzer.",
      "If the event has piled up several times, compare whether the stop code is the same each time — if the code differs every time, suspect memory (RAM) before one specific driver."
    ],
    caution: ["The record itself is not the cause; it only states that a crash happened and its details. Use the stop code to narrow the candidates."],
    faqs: [
      ["How do BugCheck 1001 and Windows Error Reporting 1001 differ?", "They share the event ID but have different sources. BugCheck records the stop code and parameters at the moment of the crash; Windows Error Reporting only records afterwards that the error was reported. BugCheck is more direct for analysis."],
      ["No dump file was created. Can I still analyze with only this event?", "Yes. The stop code and parameters in the event body are enough to look up the candidate causes and a check order; if a dump exists, analyzing it identifies the faulty driver more precisely."]
    ],
    refs: [],
    related: ["wer-1001", "kernel-power-41", "whea-logger-18"]
  },

  "disk-7": {
    ko: "event-disk-7.html",
    source: "Disk", id: "7", area: "Storage",
    title: "Disk Event 7: Bad Block on a Drive — Back Up First",
    desc: "Disk 7 means the storage device reported a block that cannot be read. If it repeats, protect your data before running any check.",
    lead: "Disk 7 records that an unreadable block was detected on a storage device. If it repeats, consider the risk of data loss first.",
    body: [
      "The event message can show a Harddisk number that does not directly match the drive letter in File Explorer. Check the physical disk number and model in Disk Management or PowerShell so you do not test the wrong device."
    ],
    sections: [
      ["A safe order", [
        "Copy important files in use to another physical drive or the cloud.",
        "Check health with CrystalDiskInfo and the maker's diagnostic tool: reallocated, pending and uncorrectable sector counts.",
        "For SATA devices, replace the data cable and power connector and compare on another port.",
        "For NVMe, check M.2 seating, heatsink pressure, temperature and firmware.",
        "After the backup is finished, plan a file-system check and a surface diagnostic."
      ]],
      ["If event 7 appears only once", [
        "You may have pulled an external disk, or a cable may have been briefly unstable. If it is a one-off, watch whether 51, 55, 129 or 153 follow on the same disk, and whether you get real read errors. If the same block errors increase or file copies stall, it is safer to reduce use."
      ]]
    ],
    conditions: ["File copy stalls or fails", "Slow response when reading certain files", "Disk errors after an external drive was disconnected"],
    causes: ["Bad blocks on the drive", "Cable or power instability", "A degrading storage device"],
    checks: [
      "Back up important files to a different physical drive or the cloud first.",
      "Identify the disk number and model; check SMART with CrystalDiskInfo or the vendor tool.",
      "Swap the data cable and port (SATA) or re-seat the module (NVMe) and compare.",
      "After backing up, plan a file-system check and a surface test."
    ],
    caution: [
      "Do not run chkdsk repair options or write-heavy scans repeatedly before backing up: cleaning up the file system can add load to a physically unstable device. Normal SMART does not prove the device is healthy if the events and real read failures keep repeating.",
      "Replacement becomes a priority if reallocated/pending sectors grow, the maker's diagnostic fails, the same error appears with another cable or port, or unreadable files appear."
    ],
    faqs: [
      ["Event 7 appeared once. Should I replace the disk right away?", "If it is a one-off, observation comes before replacement: you may have pulled an external disk, or a cable may have been briefly unstable. If 51, 55, 129 or 153 grow on the same disk, or real read errors occur, replace sooner."],
      ["SMART is normal but event 7 keeps appearing. Why?", "SMART warns only when a maker-defined threshold is crossed, so bad sectors below the threshold, or cable/connection problems, can still show as normal. If events and real read failures repeat, you cannot assume the device is fine."],
      ["Does it happen on external drives?", "Yes. USB-connected drives can log it too. Besides the disk itself, USB cables, hubs and unstable port power are common causes."]
    ],
    refs: [["https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors", `${MS}: Troubleshoot disk errors and data corruption`]],
    related: ["disk-51", "ntfs-55"]
  },

  "disk-51": {
    ko: "event-disk-51.html",
    source: "Disk", id: "51", area: "Storage",
    title: "Disk Event 51: An Error During a Paging Operation",
    desc: "Disk 51 is a warning that a storage I/O error or delay occurred during paging. If it repeats on the same disk, secure a backup before anything else.",
    lead: "51 is a warning that storage I/O was delayed or failed during a paging operation. It is classed below the error level of event 7, but if its frequency grows it can be an early sign of the same storage problem.",
    body: [
      "If it rarely shows in light work and appears only with large file jobs or many programs open at once, low system memory (RAM) may be the background rather than the drive itself."
    ],
    sections: [
      ["What the record points to", [
        "Paging is how Windows moves data between memory and disk. An error there means the drive did not respond properly or in time.",
        "In the name \\Device\\Harddisk0\\DR0 the number identifies the disk; match it to the disk number in Disk Management (diskmgmt.msc) to find which device it is.",
        "A single record may be a temporary delay, but if it repeats on the same disk, secure a backup first."
      ]]
    ],
    conditions: ["Freezing during heavy work", "Delay while accessing the page file"],
    causes: ["Slow disk response", "Unstable cable or power", "Degrading drive condition"],
    checks: [
      "Identify the disk: read N in \\Device\\HarddiskN\\DR in the description and compare it with the disk number in diskmgmt.msc.",
      "Back up important files first — storage response is abnormal, so backup comes before scanning.",
      "Check SMART in CrystalDiskInfo: reallocated, pending and uncorrectable sectors. If they are non-zero and rising, consider replacement.",
      "Check the connection: swap SATA cable and port; for M.2 NVMe, re-seat the module fully. A bad cable is a more common cause than expected."
    ],
    caution: ["The more it repeats, the higher the risk of data loss."],
    faqs: [
      ["Is 51 less serious than event 7?", "It is classed as a warning, but if it repeats it can be an early sign of declining drive health, like 7. Check how often it repeats rather than the level."],
      ["Why does it appear only when memory use is high?", "It is recorded when disk response is slow at the moment the page file is accessed, so it can show more often when low memory forces frequent paging."]
    ],
    refs: [],
    related: ["disk-7", "ntfs-55"]
  },

  "ntfs-55": {
    ko: "event-ntfs-55.html",
    source: "Ntfs", id: "55", area: "Storage",
    title: "Ntfs Event 55: File System Corruption — Back Up Before chkdsk",
    desc: "Ntfs 55 means corruption was found in the NTFS file-system structure. Back up your data first, then check the drive, and only then run chkdsk.",
    lead: "55 records that corruption was detected in the NTFS file-system structure. It can come from an abnormal shutdown or from the storage device itself. Back up the data before running any repair command.",
    body: [
      "In the properties window of event 55, the General tab says that corruption was found in the file system structure of the volume, with the MFT (master file table) file record number and the name of the affected file. The file name is a clue to what is affected, so if that file is important, back it up before scanning.",
      "If the damage is wide, parts of the files or folders may not be recovered or may disappear during the scan, so back up what you can still access before running chkdsk."
    ],
    sections: [
      ["Backup comes before the check", [
        "If you run chkdsk /f first, some files can be lost or moved to a found.000 folder with new names. So work in this order: back up → check drive health → run the scan. If the drive itself is failing, a scan can make its condition worse."
      ]]
    ],
    conditions: ["A disk check prompt after boot", "Errors accessing files or folders"],
    causes: ["Abnormal shutdown", "Storage device errors", "Damaged file-system metadata"],
    checks: [
      "Back up important data first. Some files may be moved to found.000 or lost during repair.",
      "Check drive health: look at SMART in CrystalDiskInfo. If the status is “Caution” or reallocated sectors are rising, consider replacement before scanning.",
      "Run the scan when there is time: chkdsk C: /f from an administrator prompt schedules a check on reboot. Large drives can take hours, so start when you do not need to cut power.",
      "Check whether abnormal shutdowns repeat: if EventLog 6008 is frequent, the way the PC shuts down may be the cause, and it must be fixed to prevent recurrence."
    ],
    caution: ["If there are signs of drive failure, do not start a write-heavy repair first."],
    faqs: [
      ["Do I always run a disk check when 55 appears?", "Back up important data first. On a physically unstable disk, a write-heavy scan itself can add load."],
      ["The PC ran a disk check automatically after reboot. Is that normal?", "Yes. When NTFS corruption is detected, Windows may schedule a scan at the next boot. Do not force shutdown before it finishes."]
    ],
    refs: [],
    related: ["disk-7", "disk-51", "eventlog-6008"]
  },

  "distributedcom-10016": {
    ko: "event-distributedcom-10016.html",
    source: "DistributedCOM", id: "10016", area: "Applications & services",
    title: "DistributedCOM Event 10016: Permission Warning — Usually Safe to Ignore",
    desc: "DistributedCOM 10016 says a COM component was not granted the local launch or activation permission it asked for. It is common on healthy PCs and usually not urgent.",
    lead: "10016 is a warning that a specific COM component did not get the local launch/activation permission it requested. It piles up on perfectly healthy PCs and is usually not urgent.",
    body: [
      "This warning alone cannot tell you whether any slowdown or malfunction really exists. If you notice no symptom, there is no need to hunt for its cause and remove it."
    ],
    sections: [
      ["Usually no action is needed", [
        "10016 is logged on normally working PCs. Under the default Windows permission design, some components request a permission and are refused, which is normal behavior; Microsoft's guidance treats it as ignorable if no function fails.",
        "Many guides online tell you to change permissions in the registry and Component Services, but altering default permissions can weaken security. If there is no actual symptom, it is safer to leave them alone."
      ]]
    ],
    conditions: ["A one-off during boot, sign-in or app launch"],
    causes: ["The default Windows permission design", "Restricted requests from an app component"],
    checks: [
      "First check whether anything actually failed at the same time. If there is no visible symptom, there is nothing to fix.",
      "Note the CLSID/APPID from the description and see whether the same value repeats. If it differs every time, it is hard to call it a problem of one component.",
      "Do not change permissions at random. Editing permissions in Component Services is widely described, but changing the default design can weaken security and is not recommended before a real failure is confirmed.",
      "If there is a failure, act on that application: search the CLSID to see which program it belongs to; if that function really fails, repair or update the program instead of touching permissions."
    ],
    caution: ["Do not follow registry or DCOM permission changes from the internet as they are."],
    faqs: [
      ["Can I just ignore this error?", "In most cases, yes. It is a frequent warning in Event Viewer, but if programs work normally, no action is needed."],
      ["Should I follow DCOM permission fixes found online?", "Not recommended unless a real function fails. Wrongly changing permission values in Component Services can affect the normal operation of other programs."],
      ["Why is it logged so often?", "Under the default Windows permission design it is common for an app component to request local launch permission and be refused, so it tends to pile up even on healthy PCs."]
    ],
    refs: [],
    related: ["service-7000"]
  },

  "service-7000": {
    ko: "event-service-7000.html",
    source: "Service Control Manager", id: "7000", area: "Applications & services",
    title: "Service Control Manager Event 7000: Service Failed to Start",
    desc: "SCM 7000 records that a Windows service could not start. Identify the service and copy the error text exactly before disabling or deleting anything.",
    lead: "7000 records that a Windows service failed to start. It is safer to identify which program the service belongs to first than to delete it blindly.",
    body: [
      "If several services fail at the same moment, it may not be one program's problem but a recent update or a block by security software, so check those too."
    ],
    sections: [
      ["How to read the description", [
        "The description reads “The X service failed to start due to the following error: <error text>”. Write down two things.",
        "The display name and the service name are different: Print Spooler in the event is the display name, while the sc command needs the service name such as Spooler. Open the properties in services.msc to see both.",
        "Copy the error text exactly instead of summarizing it. The same service needs completely different actions depending on the wording."
      ]]
    ],
    conditions: ["Right after boot", "When an app or device service starts"],
    causes: ["Missing service file", "Permission or account problems", "Leftover entries from removed programs"],
    checks: [
      "Identify the service name and the error text. “The system cannot find the file specified” means the executable is gone; “Access is denied” is a log-on account permission problem; “did not respond in a timely fashion” should be read together with 7009 as a delay problem.",
      "Check that the executable still exists: run sc qc <service name> from an administrator prompt and paste BINARY_PATH_NAME into File Explorer. A service registration left behind after the program was removed is the most common cause.",
      "Check the log-on account and password: in services.msc open the service, Log On tab. If a service that was Local System now uses a specific user account whose password recently changed, it will fail to start; re-enter or reassign the account.",
      "Decide whether the service is needed before cleaning up: if it is clearly a leftover from a removed program, sc delete <service name> removes the registration. If unsure, set the startup type to Disabled instead and use the PC for a few days; choose the reversible option first."
    ],
    caution: ["Do not disable services at random."],
    faqs: [
      ["I do not know what this service is. Can I delete it?", "Search the service name to see which program it belongs to before deleting. Deleting unknown services at random can stop other functions."],
      ["It appears every boot. Does it affect performance?", "If no function fails there is little immediate effect, but if records keep piling up, reinstalling the related program to clean it up is recommended."],
      ["Starting it manually works — why does it fail automatically?", "Right after boot, the network or another prerequisite service may not be ready yet. If a manual start succeeds, change the startup type to Automatic (Delayed Start), which brings the service up after boot has mostly finished and avoids ordering failures."]
    ],
    refs: [],
    related: ["service-7034", "application-error-1000"]
  },

  "service-7034": {
    ko: "event-service-7034.html",
    source: "Service Control Manager", id: "7034", area: "Applications & services",
    title: "Service Control Manager Event 7034: Service Terminated Unexpectedly",
    desc: "SCM 7034 records a service that ended unexpectedly with no recovery action configured. It differs from 7031 only in the recovery setting, not in severity.",
    lead: "7034 is logged when a service terminated unexpectedly and no recovery action was recorded. Check whether you actually use that service before judging how relevant it is.",
    body: [
      "If the records started at a particular point (for example right after an update), reverting that change is the quickest way to check."
    ],
    sections: [
      ["How it differs from 7031", [
        "Both mean a service ended unexpectedly. The difference is not severity but whether a recovery action is configured.",
        "7031 — a recovery action (for example restart the service) is set, so Windows scheduled a response.",
        "7034 — the recovery action is “Take No Action”, so there is nothing to schedule.",
        "So 7034 is not less serious than 7031. Because there is no automatic recovery, the function stays stopped until the next reboot."
      ]]
    ],
    conditions: ["A feature suddenly stops"],
    causes: ["The service itself crashed", "An update or configuration mismatch"],
    checks: [
      "Identify the service and the program it belongs to: open it in services.msc to read the description and executable path.",
      "Use the Recovery tab to separate it from 7031: if the recovery action is “Take No Action”, Windows has nothing to schedule, so 7034 is logged instead of 7031.",
      "Compare when the records began with program installs or Windows updates around that date; if it started at a specific time, reverting that change is the fastest check.",
      "If the function is unused, observe before acting; if records keep piling up, reinstall or remove the related program."
    ],
    caution: ["First check whether the service is one you do not use."],
    faqs: [
      ["What is the difference between 7031 and 7034?", "7031 comes with information that Windows scheduled a recovery action (such as a restart); 7034 is recorded with no such recovery information, only the termination."],
      ["Can I ignore it if I do not use the service?", "If it belongs to a feature you really do not use, the impact is small. If it relates to a recently installed program, consider updating or reinstalling it."],
      ["Will changing the recovery action to restart fix it?", "The record changes from 7034 to 7031 and the feature revives automatically, but the cause of the termination remains. It is a stopgap; check the cause of the repeated termination separately."]
    ],
    refs: [],
    related: ["service-7000"]
  },

  "display-4101": {
    ko: "event-display-4101.html",
    source: "Display", id: "4101", area: "Graphics",
    title: "Display Event 4101: Graphics Driver Stopped Responding and Recovered",
    desc: "Display 4101 usually means the GPU did not respond in time and Windows restarted the graphics driver (TDR). It does not prove the graphics card is broken.",
    lead: "Event 4101 is mainly recorded when the GPU fails to respond within the allowed time and Windows restarts the graphics driver (Timeout Detection and Recovery).",
    body: [
      "The usual symptom is the screen going black briefly and returning, or a game closing to the desktop. It looks like a driver problem, but GPU overheating, auxiliary power, overclocking and browser hardware acceleration can produce the same result."
    ],
    sections: [
      ["Check by condition", [
        "Only in one game: compare game updates, overlays, the shader cache and the driver version.",
        "Also in video or the browser: check hardware acceleration and multi-monitor refresh-rate combinations.",
        "With screen corruption or high temperature: look first at GPU temperature, hot spot, fans and auxiliary power cables."
      ]],
      ["When it connects to a blue screen", [
        "If 0x00000116 or 0x000000EA also appear, driver recovery may have failed and led to a system halt. Do not just reinstall the driver repeatedly; also check power, cooling and the stability of the GPU itself."
      ]]
    ],
    conditions: ["Black screen for a moment, then it returns", "A game exits to the desktop", "Screen corruption under load"],
    causes: ["Driver bug or incompatibility", "GPU overclock or undervolt", "Overheating or insufficient auxiliary power", "Hardware acceleration in a browser or app"],
    checks: [
      "Record which app, the time, and whether the screen came back or the PC rebooted.",
      "Check the driver version and faulting module in dxdiag and the event.",
      "Restore any GPU overclock and undervolt to defaults.",
      "Clean-remove the current driver and install the vendor's stable version to compare.",
      "Check GPU auxiliary power and temperature, and whether it reproduces on another output cable or monitor."
    ],
    caution: ["Stop load tests immediately if you see screen corruption, a stopped fan or a burning smell. Run short comparisons only when there are no signs of hardware damage."],
    faqs: [
      ["Does this event mean the graphics card has failed?", "No. It is the result of a driver restart after the GPU did not respond in time, not a sign that the GPU itself broke. Driver bugs, overclocking, heat and insufficient auxiliary power are more common causes. If temperatures are abnormally high or a fan has stopped, check the hardware first."],
      ["Will updating to the newest driver always fix it?", "Not always. The newest driver can increase symptoms with a particular game or app. Compare the latest version with the version the vendor marks as stable."],
      ["Why does it occur only in one game?", "A corrupted shader cache, a conflict with an overlay, or a particular graphics-API call pattern may be the cause. If it began after a game update, delete the shader cache or turn overlays (Discord, GeForce Experience and similar) off and see whether it reproduces."]
    ],
    refs: [
      ["https://learn.microsoft.com/windows-hardware/drivers/display/timeout-detection-and-recovery", `${MS}: Timeout Detection and Recovery (TDR)`]
    ],
    related: ["whea-logger-18", "kernel-power-41"]
  },

  "whea-logger-1": {
    ko: "event-whea-logger-1.html",
    source: "WHEA-Logger", id: "1", area: "Hardware errors",
    title: "WHEA-Logger Event 1: Uncorrectable Hardware Error Record",
    desc: "WHEA-Logger 1 is an error record for a hardware error that could not be corrected. Read the error source and type to tell CPU, PCIe and memory layers apart.",
    lead: "WHEA-Logger 1 records an uncorrectable hardware error as an error record. Unlike 18, you must read the shown error source and type yourself to tell whether the CPU, PCIe or memory layer is involved.",
    body: [
      "Note ErrorSource, ErrorType, Processor APIC ID and the PCIe device information on the Details tab. Turning XMP/EXPO and overclocking off and checking whether the symptom still reproduces separates a settings problem from a hardware problem. Do not decide on a part from a single record."
    ],
    conditions: ["Before or after a blue screen or forced reboot", "High-load work such as games or rendering", "The event repeats with no screen freeze"],
    causes: ["Unstable CPU cores/cache or memory controller", "PCIe device or link errors", "XMP/EXPO, overclock or undervolt settings", "BIOS, chipset or device firmware problems", "Physical instability of CPU, RAM, GPU, motherboard or power"],
    checks: [
      "Record ErrorSource, ErrorType, Processor APIC ID and PCIe device information from Details.",
      "Turn off XMP/EXPO and overclocks and compare whether it reproduces at default settings.",
      "Check BIOS, chipset, GPU and SSD firmware against the vendors' information.",
      "Compare Kernel-Power 41, BugCheck 1001 and WHEA 17/18/19 from the same time.",
      "If it repeats, back up important files and cross-test CPU, RAM, GPU and PCIe devices one at a time."
    ],
    caution: [
      "Do not decide on a specific part from WHEA 1 alone. The source of the error record and the conditions under which it repeats matter more.",
      "Do not repeat long stress tests without a backup."
    ],
    faqs: [
      ["Do I need to replace a part right away?", "No. Back up first, restore settings to default and compare whether it reproduces, then go through BIOS/firmware updates and cross-testing parts."],
      ["Records repeat but the screen never freezes.", "Even without symptoms, whether the same error source repeats matters. Keep a note of how often and when it occurs, and compare whether it increases under heavy load."]
    ],
    refs: [
      ["https://learn.microsoft.com/windows-hardware/drivers/whea/whea-hardware-error-events", `${MS}: WHEA hardware error events`]
    ],
    related: ["whea-logger-18", "kernel-power-41", "bugcheck-1001"]
  },

  "whea-logger-18": {
    ko: "event-whea-logger-18.html",
    source: "WHEA-Logger", id: "18", area: "Hardware errors",
    title: "WHEA-Logger Event 18: Fatal Hardware Error — What to Check",
    desc: "WHEA-Logger 18 is Windows reporting an uncorrectable hardware error. If it repeats, back up first, reset overclock/XMP to defaults and read the error type.",
    lead: "WHEA 18 is Windows reporting a hardware error it could not correct. If it repeats, a backup and a return to default settings come first.",
    body: [
      "The event body may show error types such as Cache Hierarchy, Bus/Interconnect or Memory, and sometimes a Processor APIC ID. An APIC ID alone cannot confirm a faulty CPU, because voltage settings, the memory controller, BIOS, temperature and power delivery can produce the same error."
    ],
    sections: [
      ["What to do first", [
        "If reboots repeat while saving, back up important files to another storage device.",
        "In BIOS, return CPU overclock, undervolt, PBO and XMP/EXPO to defaults.",
        "Record the event's Error Type, APIC ID and time, and see whether it repeats in the same task.",
        "Check CPU and GPU temperature, motherboard VRM cooling and the EPS power connection.",
        "Install memory modules one at a time at default speed and cross slots and modules."
      ]],
      ["Reading by situation", [
        "If it happens only in games or rendering, look first at heat, power supply and the load on particular cores. If it happens at idle, also check sleep transitions, undervolting and BIOS power management. If a memory test passes but errors occur only with XMP, it may be a combination of memory-controller and settings problem rather than a bad module."
      ]],
      ["What to read in the event body", [
        "Press the Windows key, type eventvwr.msc and open Event Viewer. Choose Windows Logs → System, then in Filter Current Log set the event source to WHEA-Logger to see only the related records.",
        "Open event 18 and note four items in the General text: Reported by component, Error Source, Error Type and Processor APIC ID.",
        "To list recent records at once, run in PowerShell: Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-WHEA-Logger'} -MaxEvents 20 | Format-Table TimeCreated, Id, LevelDisplayName"
      ]],
      ["Judging by frequency", [
        "A single record with no recurrence for weeks is often enough to note what was happening (forced shutdown, power cut, PSU change) and just watch.",
        "If it repeats only in a certain game or render, the heat and power pattern of that task is the clue; run the same task at lower load and compare.",
        "If the Processor APIC ID is always the same, it repeats on a specific logical processor — a reason to undo per-core voltage offsets or curve settings and compare. If the ID is scattered, look at overall CPU voltage, memory and power supply together.",
        "If it repeats several times a day even at default settings, it has gone beyond a settings problem: prepare cross-testing of parts or a vendor check."
      ]],
      ["WHEA event numbers at a glance", [
        "First decide whether it is Corrected or Fatal rather than memorizing numbers. Watch the trend of corrected records; for fatal ones move straight to backup and checks.",
        "17 · an error corrected on a PCIe device",
        "18 · an uncorrectable fatal hardware error; often reported as processor-related (this page)",
        "19 · a corrected hardware error; count whether it is a sign before it worsens to 18",
        "20 · a fatal hardware error; check the reported component to narrow the range",
        "46 · an error with the memory hierarchy identified",
        "47 · a corrected memory error"
      ]]
    ],
    conditions: ["Reboot or blue screen during high-load work", "Repeated reboots while saving"],
    causes: ["Unstable CPU or memory controller settings", "Overclock, undervolt, PBO or XMP/EXPO", "Heat or insufficient power supply", "BIOS firmware bugs or an aging part"],
    checks: [
      "Back up important files to another drive.",
      "Reset overclock, undervolt, PBO and XMP/EXPO to defaults.",
      "Record Error Type, APIC ID and time; see whether it repeats in the same task.",
      "Check temperatures and cooling, and the EPS connection.",
      "Cross-test memory one module at a time at default speed."
    ],
    caution: [
      "Do not turn off the WHEA service or raise voltage at random to hide the error. Repeating long stress tests without knowing the cause increases the risk of data damage and overheating. If it repeats even at default settings, go on to the maker's diagnostics and part cross-testing.",
      "Kernel-Power 41 is the reboot result and BugCheck 0x124 is the hardware-error stop code. If all three have the same time, compare them as one failure."
    ],
    faqs: [
      ["Should I replace the CPU right away if WHEA 18 appears?", "No. A recorded Processor APIC ID does not mean a bad CPU. Voltage settings, the memory controller, BIOS settings, temperature and power supply can cause the same error. Reset overclock/undervolt to default and check temperature and power first; suspect the CPU itself only if it still repeats."],
      ["It keeps happening although the memory test passes.", "Ordinary memory tests often run at default speed and may not catch instability under XMP/EXPO overclocking. If the error appears only with XMP on, it is more likely a combination of memory controller and overclock settings than a bad module."],
      ["Can it occur even if I never overclocked?", "Yes. Automatic voltage and boost behavior set by the motherboard maker can act like an overclock, and VRM heat, BIOS firmware bugs or a defective aging part can also cause it."]
    ],
    refs: [
      ["https://learn.microsoft.com/windows-hardware/drivers/whea/whea-hardware-error-events", `${MS}: WHEA hardware error events`],
      ["https://learn.microsoft.com/windows-hardware/drivers/whea/hardware-errors-and-error-sources", `${MS}: Hardware errors and error sources`]
    ],
    related: ["whea-logger-1", "kernel-power-41", "bugcheck-1001", "display-4101"]
  },

  "security-4625": {
    ko: "event-security-4625.html",
    source: "Security", id: "4625", area: "Security & accounts",
    title: "Security Event 4625: An Account Failed to Log On",
    desc: "Security 4625 records a failed logon. Read the failure reason code and logon type to tell a simple typo from an outside access attempt.",
    lead: "4625 records that an account failed to log on. The failure reason code and the logon type (interactive / remote / network) tell a simple typo apart from an external access attempt.",
    body: [
      "If a specific account fails repeatedly at short intervals at times you did not try, check whether an externally reachable path such as Remote Desktop or a shared folder is exposed."
    ],
    conditions: ["A sign-in failure message", "Domain account access errors", "Remote Desktop connection failure"],
    causes: ["Repeated wrong passwords", "CapsLock or input-language switching problems", "Expired saved credentials", "External brute-force attempts"],
    checks: [
      "Check the failure reason code (such as 0xC000006D) and the logon type.",
      "See whether only a specific account fails repeatedly.",
      "For remote access, check the source IP."
    ],
    caution: ["Repeated failures on the same account clustered in a short time may be a security threat."],
    faqs: [
      ["Is an occasional 4625 normal?", "If you mistyped the password or CapsLock/input language was wrong, it is a normal record. What matters is whether it repeats in a burst on a specific account in a short time."],
      ["The source IP is an unknown external address. What do I do?", "Check whether Remote Desktop or sharing services are exposed to the internet; if they are not needed, close the port or tighten firewall rules, and change the account password immediately."]
    ],
    refs: [
      ["https://learn.microsoft.com/windows/security/threat-protection/auditing/event-4625", `${MS}: Event 4625 (an account failed to log on)`]
    ],
    related: ["security-4740", "security-1102"]
  },

  "security-4740": {
    ko: "event-security-4740.html",
    source: "Security", id: "4740", area: "Security & accounts",
    title: "Security Event 4740: A User Account Was Locked Out",
    desc: "Security 4740 records that an account was locked out, usually after repeated 4625 failures. The caller computer name shows which device caused it.",
    lead: "4740 records that an account was locked out. In most cases it is the result of 4625 (failed logon) repeating over a short time. The caller computer name identifies which device kept failing.",
    body: [
      "If you changed the password recently, places that still store the old one — Credential Manager, scheduled tasks, a phone mail app — often retry automatically and lock the account."
    ],
    conditions: ["An account-locked message at sign-in", "No access from a domain-joined PC", "Errors in apps that use saved credentials"],
    causes: ["Several devices retrying an expired password on the same account", "Old passwords in Credential Manager", "Expired credentials in scheduled tasks or services"],
    checks: [
      "Use the caller computer name in the event to find the device causing the lockout.",
      "Delete or update the account's entries in Credential Manager.",
      "Update the password of the accounts used by scheduled tasks and services."
    ],
    caution: ["Repeated lockouts are often caused by expired credentials stored in several places."],
    faqs: [
      ["My account gets locked although I did not change the password.", "Someone else may have tried, but first check Credential Manager and the logins stored on several devices for an old password that is still left."],
      ["Where do I see the caller computer name?", "In the General tab text of Event Viewer or in the XML view of the Details tab, look for the Caller Computer Name item; it identifies the device that caused the lockout."]
    ],
    refs: [
      ["https://learn.microsoft.com/windows/security/threat-protection/auditing/event-4740", `${MS}: Event 4740 (a user account was locked out)`]
    ],
    related: ["security-4625", "security-1102"]
  },

  "security-1102": {
    ko: "event-security-1102.html",
    source: "Security", id: "1102", area: "Security & accounts",
    title: "Security Event 1102: The Audit Log Was Cleared",
    desc: "Security 1102 records that the audit log was cleared. An administrator may do this on purpose, but it also appears when traces are erased after an intrusion.",
    lead: "1102 records that the security audit log was cleared. An administrator may have tidied the log on purpose, but it can also appear when someone tries to erase traces after a compromise, so you must find who cleared it and when.",
    body: [
      "If this event appears and neither you nor your IT staff remember clearing the log, compare the sign-in records and the traces of programs that ran just before the clearing in other logs, such as the System log."
    ],
    conditions: ["After the Security event log was reset", "When malware infection is suspected"],
    causes: ["Intentional log clearing by an administrator", "Log clearing by malicious software"],
    checks: [
      "Check the account name and time of the person who cleared the log.",
      "Compare unusual sign-ins or program executions before and after the clearing.",
      "If the clearing was not intended, carry out a security check."
    ],
    caution: ["An unintended clearing of the security log can be a sign of a security incident."],
    faqs: [
      ["Does 1102 always mean I was hacked?", "No. It is also left by a normal, administrative log cleanup. If you do not remember clearing it, check whether the account name and time match your or your IT staff's work."],
      ["Can the earlier records be restored once the log is cleared?", "By default, a cleared event log is hard to recover. Exporting logs regularly to files lets you check earlier records even in such a case."]
    ],
    refs: [
      ["https://learn.microsoft.com/windows/security/threat-protection/auditing/event-1102", `${MS}: Event 1102 (the audit log was cleared)`]
    ],
    related: ["security-4625", "security-4740"]
  },

  "windowsupdateclient-20": {
    ko: "event-windowsupdateclient-20.html",
    source: "WindowsUpdateClient", id: "20", area: "Windows Update",
    title: "WindowsUpdateClient Event 20: Update Installation Failed",
    desc: "WindowsUpdateClient 20 records that Windows Update could not finish installing a specific update. Check the failed KB and the error code first.",
    lead: "Event 20 records that the Windows Update Agent could not complete the installation of a specific update. Do not judge that all of Windows is broken from this event alone; first check the failed KB and the accompanying error code.",
    body: [
      "Note updateTitle, updateId, errorCode and the install time in the General tab or the XML. Even with the same event 20, the cause and fix differ between a cumulative update, a .NET update and a driver update."
    ],
    sections: [
      ["Direction by error code", [
        "0x800F0922 can have several causes, such as the space of the system reserved partition or network paths. For 0x80070002 compare file and cache paths first; for 0x80070005, permissions or a block by security software. Changing the registry or services at random without looking at the code can damage the next update as well."
      ]],
      ["Repeated or one-off", [
        "If it failed once and succeeded on the next attempt, it may have been a temporary network or server response problem. If the same KB repeats over several days and service 7000/7009 or storage 129/153 appear together with event 20, it may not be only an update problem, so check storage and service state too."
      ]],
      ["When the error code is not enough", [
        "Look for the same time range in %windir%\\Logs\\CBS\\CBS.log. Event Viewer shows only the result and the final error code, while CBS.log keeps step-by-step records of which component was being processed when it failed, which helps separate cases that share the same errorCode but fail at different points."
      ]]
    ],
    conditions: ["A failed-update message in Windows Update history", "The same KB fails repeatedly"],
    causes: ["A failed or conflicting update package", "Low free space or a damaged update cache", "Network, proxy or security software blocking", "Driver update compatibility"],
    checks: [
      "Identify the failed KB: in Settings → Windows Update → Update history, see whether the same KB fails repeatedly.",
      "Record the error code, such as 0x800F0922, 0x80070002 or 0x80070005. If none is shown, read the Data value in the event XML.",
      "Check the basics: free space on the system drive, automatic date and time, VPN/proxy and the network connection.",
      "Separate components: if several KBs fail, suspect update components or system files; if only a driver KB fails, suspect vendor driver compatibility first.",
      "Back up before repair: before resetting the update cache or running system repair, back up important files and confirm a restore point."
    ],
    caution: ["Event 20 tells you which update failed. It is not a diagnosis that confirms the cause on its own. Record the KB number, errorCode and the repeat conditions together so the next check is accurate."],
    faqs: [
      ["Should I force the update to install when event 20 appears?", "No. Check the failed KB and error code, then take a backup and check the basic environment first."],
      ["Can event 20 alone tell me the disk is failing?", "No. Compare whether Disk, Ntfs and StorPort events from the same time repeat."],
      ["Update history says success, but event 20 remains.", "It may be the record of a previous failed attempt. Separate whether the same KB succeeded afterwards from the most recent time of occurrence."]
    ],
    refs: [
      ["https://support.microsoft.com/en-us/sbs/windows/fix-windows-update-errors-18b693b5-7818-5825-8a7e-2a4a37d6d787", "Microsoft Support: Fix Windows Update errors"],
      WINEVENT
    ],
    related: ["service-7000", "disk-51"]
  }
};

export const enAreaOrder = ["Power & shutdown", "Crashes & reports", "Hardware errors", "Graphics", "Storage", "Applications & services", "Security & accounts", "Windows Update"];
