// English editions, batch 2 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims).

const MS = "Microsoft Learn";

export const eventEn2 = {
  "dotnet-runtime-1026": {
    ko: "event-dotnet-runtime-1026.html",
    source: ".NET Runtime", id: "1026", area: "Applications & services",
    title: ".NET Runtime Event 1026: Unhandled .NET Exception",
    desc: ".NET Runtime 1026 records that a .NET program ended on an unhandled exception. Read it together with Application Error 1000 to tell an app problem from a shared-runtime problem.",
    lead: ".NET Runtime 1026 records that a program running on .NET hit an unhandled exception and the process ended. Check the target app and the exception type before reinstalling anything.",
    body: [
      "Do not simply uninstall and reinstall .NET because of this event alone. If it repeats only in one app, look at that app's runtime version, plug-ins and settings; if several .NET apps fail, compare the shared runtime and the Windows Update state."
    ],
    conditions: ["A .NET app closes right after it starts", "An exception dialog appears in a specific feature", "It repeats at the same time as event 1000"],
    causes: ["An error in the app code or its settings", "A missing .NET runtime component", "Plug-in, permission or file-access problems"],
    checks: [
      "Record the exception text and the app name.",
      "Compare the faulting module and exception code in Application Error 1000.",
      "Repair the app, then check the required .NET components and updates.",
      "If several .NET apps repeat it, check system files and storage health."
    ],
    caution: ["Do not uninstall and reinstall .NET on the strength of 1026 alone. Check the exception type and the version the app requires first."],
    faqs: [
      ["Do I need to reinstall .NET when 1026 appears?", "Not always. First check the exception type and the .NET version the target app requires, and consider repairing or updating from the official installer before anything else."],
      ["Does 0xC0000005 alongside it mean bad RAM?", "No. An invalid memory access can also come from an app bug, a plug-in or a driver. Compare whether it repeats only in one app or across several."]
    ],
    refs: [],
    related: ["application-error-1000", "application-hang-1002"]
  },

  "service-7001": {
    ko: "event-service-7001.html",
    source: "Service Control Manager", id: "7001", area: "Applications & services",
    title: "Service Control Manager Event 7001: Dependency Service Failed",
    desc: "SCM 7001 means a service could not start because a service it depends on did not start. The dependency named second is the one to fix.",
    lead: "7001 records that a service could not start because another service it depends on did not start. Check the name of the dependency shown in the description first.",
    body: [
      "Starting the failed dependency by hand in the Services console shows whether only that service is broken or a whole chain is."
    ],
    sections: [
      ["How to read the description", [
        "Two service names appear in one sentence, and mixing up their roles means fixing the wrong service.",
        "The name that comes first is the service that could not start. It shows the symptom, not the cause.",
        "The name that comes after is the prerequisite service that actually failed. Investigate and act on that one.",
        "So most of the work on a 7001 is really checking 7000 or 7023 for that second service."
      ]]
    ],
    conditions: ["At boot or when an app starts"],
    causes: ["A prerequisite service failed", "Damaged service configuration"],
    checks: [
      "Identify the dependency in the description. The wording is “The X service depends on the Y service, which failed to start”. The service to fix is Y, not the X that is named prominently; restarting only X makes the same record repeat.",
      "Find the 7000/7023 record for Y from the same time: sort Event Viewer by time and look a few seconds before 7001. The real error text for Y is there and is the starting point.",
      "Follow the dependency tree to the end: in services.msc open Y's properties and the Dependencies tab. If Y depends on yet another service, check the very start of the chain; fixing a middle service does not help if the first one still fails.",
      "Repair the first service in the chain according to its own error text. Once it is healthy, the 7001 records that followed normally disappear without further action."
    ],
    caution: ["Do not edit the dependency registry entries at random."],
    faqs: [
      ["How do I find out which dependency failed?", "The failed dependency's name is shown in the event description. Check its state and startup type in services.msc."],
      ["If 7000 and 7001 appear together, which is the cause?", "The service in the earlier 7000 is most likely where the failure started. Compare the times and the service names to confirm the order."],
      ["Where do I see what a service depends on?", "In services.msc, double-click the service and open the Dependencies tab: it lists what the service depends on and what depends on it."]
    ],
    refs: [],
    related: ["service-7000", "service-7023", "service-7009"]
  },

  "service-7009": {
    ko: "event-service-7009.html",
    source: "Service Control Manager", id: "7009", area: "Applications & services",
    title: "Service Control Manager Event 7009: Service Connection Timeout",
    desc: "SCM 7009 means a service did not connect within the allowed time. Look for the disk or network delay behind it before raising the timeout.",
    lead: "7009 records that a service did not connect within the time limit. Finding what causes the delay, such as a disk or network bottleneck, matters more than the service itself.",
    body: [
      "If the service depends on a network drive or remote storage, check that connection first; it narrows a slow-response problem faster."
    ],
    sections: [
      ["Before you raise the timeout", [
        "7009 does not say the service is broken; it says it did not respond within a set time. Raising the wait makes the record disappear but leaves the slowness.",
        "If it appears only right after boot and not during use, it is resource contention at start-up.",
        "If only one service repeats, look at the program that service belongs to first.",
        "If several services fail at the same moment, suspect the disk or the system as a whole rather than each service."
      ]]
    ],
    conditions: ["Slow boot", "Slow app start"],
    causes: ["A slow service response", "A disk or network bottleneck", "A damaged app configuration"],
    checks: [
      "Check the service name and the time waited: the number in brackets is the milliseconds Windows waited. The default is 30000 (30 seconds). The point of the record is which service did not respond within it.",
      "Look at disk and network events from the same time: if Disk 51/153 or storahci 129 appear at the same moment, the cause is storage delay, not the service, so check the disk first.",
      "Separate “only right after boot”: if so, start-up resource contention is likely. Reduce high-impact items on Task Manager's Startup tab and see whether disk usage stays at 100% for long after boot.",
      "Treat changing the timeout as the last resort: the ServicesPipeTimeout value under HKLM\\SYSTEM\\CurrentControlSet\\Control can lengthen the wait, but it only removes the record and leaves the slow cause. Consider it only if the earlier steps found no cause."
    ],
    caution: ["Find the cause of the delay before lengthening the time limit."],
    faqs: [
      ["Does raising the timeout fix it?", "A registry change to lengthen the timeout is well known, but it only delays the symptom and does not fix the underlying disk or network bottleneck."],
      ["Is it related to slow boot?", "Yes, it is a common companion of slow boot. Check disk and network events from the same time window."],
      ["Where does the 30-second figure come from?", "It is the Windows default, adjustable through the ServicesPipeTimeout value under HKLM\\SYSTEM\\CurrentControlSet\\Control. If the value is absent, 30000 milliseconds applies. Increasing it is the last resort when no cause of the delay is found."]
    ],
    refs: [],
    related: ["service-7000", "service-7011", "disk-51", "storahci-129"]
  },

  "service-7011": {
    ko: "event-service-7011.html",
    source: "Service Control Manager", id: "7011", area: "Applications & services",
    title: "Service Control Manager Event 7011: Service Control Request Timeout",
    desc: "SCM 7011 means a service did not answer a control request in time, often alongside slow shutdowns or reboots. Check for a deadlocked service.",
    lead: "7011 records that a service did not respond to a control request in time. It often appears with slow shutdown or reboot.",
    body: [
      "If it repeats on every shutdown, disable the background services of recently installed programs one at a time to narrow the cause."
    ],
    sections: [
      ["Signs that point to a deadlock", [
        "7011 means a service did not answer a control request (start, stop, pause). If the signs below appear together, it is closer to a deadlock than a simple delay.",
        "The “Shutting down services” screen stays for tens of seconds or more at shutdown.",
        "7011 repeats for the same service and each time ends in a forced shutdown.",
        "In Task Manager the service's process shows 0% CPU but its state never changes."
      ]]
    ],
    conditions: ["Slow shutdown or boot", "A device service hangs"],
    causes: ["A service deadlock", "Storage delay", "A driver that does not respond"],
    checks: [
      "Record the service name and when it happened: this event is also written after the default 30000 ms wait. Note whether it happened during shutdown or boot, which narrows the next step a lot.",
      "Check whether it comes with slow shutdown: if the “Shutting down services” screen lingers, the service is probably not answering control requests, that is, deadlocked. If EventLog 6008 is also present, it led to a forced shutdown.",
      "Check for 129/153 alongside: if storahci 129 or Disk 153 are present at the same time, storage delay blocked the service response. Check cables, NVMe slot and firmware first.",
      "Rule out third-party services with a clean boot: in msconfig → Services, tick “Hide all Microsoft services”, disable the rest and reboot. If the symptom disappears, re-enable half at a time to find the cause."
    ],
    caution: ["Force-deleting a service is the last resort."],
    faqs: [
      ["Is slow shutdown also caused by this event?", "Yes. A service that blocks the shutdown sequence without responding can delay shutdown or reboot and also record this event."],
      ["Can I delete the service by force?", "Keep that as the last resort. First check whether it reproduces in a clean boot, and try updating or reinstalling the related program."],
      ["How do I revert after a clean boot test?", "Open msconfig again, choose Normal startup on the General tab and reboot. If you found the culprit, leave only that item disabled."]
    ],
    refs: [],
    related: ["service-7009", "service-7000", "eventlog-6008"]
  },

  "service-7023": {
    ko: "event-service-7023.html",
    source: "Service Control Manager", id: "7023", area: "Applications & services",
    title: "Service Control Manager Event 7023: Service Terminated With an Error",
    desc: "SCM 7023 records a service that ended with its own error code. The text at the end of the description plus the service name narrows the cause.",
    lead: "7023 records that a service ended after returning its own error code. The wording at the end of the description, read together with the service name, narrows the cause.",
    body: [
      "If the same error repeats, searching for that wording together with the service name for a known fix is the efficient first step.",
      "On some PCs the description ends with a message such as “The system is shutting down” instead of a numeric code, and the 7023 sits a few seconds before the Kernel-Power 109 that announces the restart."
    ],
    sections: [
      ["When several services show it at once", [
        "The approach differs depending on whether 7023 comes from one service or from several at the same time.",
        "From one service only: it is a configuration or file problem of the program that service belongs to.",
        "From several at once: shared components or permission settings may have changed. Run a system file check first rather than restarting each service."
      ]]
    ],
    conditions: ["A feature fails to run", "A service stops during boot"],
    causes: ["Damaged service configuration or files", "Permission or dependency problems"],
    checks: [
      "Read the error wording in the description: because 7023 means the service ended with its own error, the text at the end is the clue. Write it down exactly, for example “Access is denied” or “The specified service is not installed”.",
      "Look up the wording together with the service's purpose: the same wording needs different action per service, so search the service name and the wording together and see which feature it belongs to.",
      "Check dependencies and the log-on account: look at the Dependencies and Log On tabs in services.msc. A permission-type message points to the log-on account; a start-failure message points to a prerequisite service.",
      "Check for damaged system files: if several services give 7023 together, suspect shared components. Run sfc /scannow from an administrator prompt first, and if it cannot repair, run DISM /Online /Cleanup-Image /RestoreHealth."
    ],
    caution: ["Restarting the service without the error text can hide the cause of recurrence."],
    faqs: [
      ["Where do I find the error code?", "At the end of the event description, where the code the service returned is shown. Searching it with the service name narrows the cause."],
      ["Can I just restart the service without the error code?", "It may work temporarily, but you can miss why it recurs. Record the error code first, then restart."],
      ["In what order do I run sfc and DISM?", "Run sfc /scannow first. If it reports damage it could not repair, run DISM /Online /Cleanup-Image /RestoreHealth to repair the component store, then run sfc once more. Both need an administrator command prompt."]
    ],
    refs: [],
    related: ["service-7000", "service-7001", "service-7034"]
  },

  "service-7031": {
    ko: "event-service-7031.html",
    source: "Service Control Manager", id: "7031", area: "Applications & services",
    title: "Service Control Manager Event 7031: Service Terminated Unexpectedly",
    desc: "SCM 7031 records a service that ended unexpectedly while Windows scheduled a recovery action such as a restart. How often it repeats decides whether to act.",
    lead: "7031 records that a service ended unexpectedly and Windows scheduled a recovery action such as a restart. Whether the count keeps growing is what decides if action is needed.",
    body: [
      "A scheduled recovery means Windows is aware of the problem, so watch whether it repeats, but do not rush to touch system files."
    ],
    sections: [
      ["What 7031 does and does not tell you", [
        "7031 tells you what stopped and how Windows will respond, but not why it stopped. Look for the cause in other records from the same time.",
        "Application Error 1000 — keeps the faulting module name and exception code. It is the most direct clue.",
        "Windows Error Reporting 1001 — if a crash report was created, the summary is here.",
        "7000/7023 for the same service — logged if it failed again after the restart."
      ]]
    ],
    conditions: ["An app or network feature suddenly stops"],
    causes: ["A service crash", "A module or driver error"],
    checks: [
      "Check the service name and the count: in “This action was performed N time(s)” N shows how much it repeats. If N keeps growing it is a reproducible problem, not a transient error.",
      "Check whether Application Error 1000 is present: 7031 reports only the result, not the faulting module. The 1000 from the same time holds the module name and exception code, and the real investigation should start from that module.",
      "Check the recovery settings: in services.msc → the service's properties → Recovery tab, look at the first and second failure actions. Restart is configured there, which is why 7031 is logged; the setting itself is not the problem.",
      "Repair the program the faulting module belongs to: if the module is a program's file, repair or update that program; if it is a driver file, reinstall that driver from Device Manager."
    ],
    caution: ["Act when the repeat count increases."],
    faqs: [
      ["Windows restarts it automatically — can I just wait?", "If a recovery action is scheduled you can wait a little. But if the count keeps rising, reinstalling the related program is safer."],
      ["How does it relate to Application Error 1000?", "They may be the same crash recorded from the service side and from the application side. Compare the times and the target program."],
      ["Which items in Application Error 1000 should I look at?", "The faulting module name and the exception code. If the module is a DLL of a program, investigate that program; if it is a driver file (.sys), investigate that device driver."]
    ],
    refs: [],
    related: ["service-7034", "application-error-1000", "service-7023", "wer-1001"]
  },

  "storahci-129": {
    ko: "event-storahci-129.html",
    source: "storahci", id: "129", area: "Storage",
    title: "storahci Event 129: Storage Device Reset — What to Check",
    desc: "storahci 129 records that Windows reset a storage controller because a request did not finish in time. Separate connection, firmware and power-management causes.",
    lead: "Event 129 is recorded when a storage request does not complete in time and Windows resets the controller. Split the causes into connection, firmware and power management.",
    body: [
      "The symptoms can be the mouse freezing for a few seconds, long game loading, or a slow SSD detection at boot. The event source can be storahci, stornvme or iaStor depending on the controller and driver, so record both the ID and the source."
    ],
    sections: [
      ["Before editing the registry", [
        "Many online guides change AHCI link power management or timeout values, but changing values can hide the symptom and miss the real device delay. Check device health, firmware and connections first, and record the old value before any change."
      ]],
      ["One-off versus repeating", [
        "If it was logged once after an update and there is no real delay, you can just observe. If 129 and 153 grow daily on the same disk, or file copies and boot stall, back up and cross-test the device. If it is the system drive, planning a replacement before the errors grow is safer."
      ]]
    ],
    conditions: ["The system freezes for a few seconds", "Game loading is slow", "An SSD is detected late at boot"],
    causes: ["Cable or port contact problems (SATA)", "Heat throttling or firmware problems (NVMe)", "Link power management or fast-start effects", "A degrading drive"],
    checks: [
      "Back up important data and check whether Disk 7, 51 or 153 appear at the same time.",
      "Check firmware, health, temperature and error history with the SSD maker's tool.",
      "Cross-check the cable and port for SATA, or the slot and cooling for NVMe.",
      "Check the motherboard chipset/storage drivers and BIOS against the maker's support information.",
      "If it happens only after resume from sleep, compare link power management and the effect of fast startup."
    ],
    caution: ["Do not change power-management or timeout registry values just to make the event go away."],
    faqs: [
      ["Which is more prone to this event, SATA or NVMe?", "Both can log it, but the usual causes differ. SATA often has cable or port contact problems; NVMe more often has controller throttling from heat or firmware issues. Identify the device type first and start with the matching checks."],
      ["What is the difference between events 129 and 153?", "129 records that Windows reset an unresponsive device; 153 is the more serious sign that the device did not respond even to that reset. If only 129 appears now and then, observing is enough; if 153 grows with it, bring forward backup and replacement planning."],
      ["Can files that were open at the time of the reset be damaged?", "Yes. If a write was in progress at the moment of the reset, that file can be damaged or the save can fail. If the event repeats, copy important working files to another drive first."]
    ],
    refs: [["https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors", `${MS}: Troubleshoot disk errors and data corruption`]],
    related: ["disk-7", "disk-51", "disk-153", "ntfs-140"]
  },

  "disk-153": {
    ko: "event-disk-153.html",
    source: "Disk", id: "153", area: "Storage",
    title: "Disk Event 153: Repeated I/O Retries on a Drive",
    desc: "Disk 153 records that a disk I/O operation was retried. It can be a temporary delay or an early sign of a connection or drive problem.",
    lead: "153 records that a disk I/O operation was retried. It can be a temporary delay or an early clue to a connection problem; check whether it grows on the same disk together with events 7 and 129.",
    body: [
      "At warning level, the disk number and PDO name at the start of the message, and the logical block address, show which disk and which place saw the retry. On one example PC it was logged on disk 2 at logical block address 0x0.",
      "If the retry count on the same disk is clearly trending up, move your backup schedule forward even if nothing seems wrong right now."
    ],
    sections: [
      ["What a retry means", [
        "153 does not say the I/O failed; it says it was retried and eventually succeeded. So files are not broken right away, but it is also a sign that the response became slower.",
        "It is often linked to symptoms such as copy speed suddenly dropping or longer game loading.",
        "If the frequency rises it may be an early sign of declining drive health, so look at the SMART values too."
      ]]
    ],
    conditions: ["Speed drops sharply during a copy", "A game freezes while loading"],
    causes: ["Slow device response", "Cable or port problems", "The effect of a filter driver"],
    checks: [
      "Check the disk and the frequency: match the disk number in the description with diskmgmt.msc to identify the device, and filter Event Viewer by this ID to count how many a day. A change in frequency is the indicator of getting worse.",
      "Check whether 129 or 7 come with it: if storahci 129 (device reset) or Disk 7 (bad block) appear at the same time, it is past a temporary delay. Raise the backup priority.",
      "Check SMART and the connection: check status in CrystalDiskInfo; for SATA recheck cable and port, for NVMe recheck the slot seating.",
      "Rule out a filter driver: antivirus, disk-encryption or virtual-drive software can sit in the I/O path and cause delay. If you installed such a program recently, stop it for a while and see whether the frequency drops."
    ],
    caution: ["If it repeats, do not dismiss it as a simple performance issue."],
    faqs: [
      ["Only 153 appears, without 7 or 129. Is that OK?", "On its own 153 may be a transient retry. But keep watching if real slowdowns appear during game loading or file copy."],
      ["Is 153 common on external drives?", "Yes. USB connections can leave this record more often than internal drives, depending on the cable and hub."]
    ],
    refs: [],
    related: ["storahci-129", "disk-7", "disk-51"]
  },

  "ntfs-98": {
    ko: "event-ntfs-98.html",
    source: "Ntfs", id: "98", area: "Storage",
    title: "Ntfs Event 98: Volume Is Healthy — A Normal Record",
    desc: "Ntfs 98 records “Volume … is healthy. No action is needed.” It is a normal check result and is not a sign of trouble.",
    lead: "Ntfs 98 appears as “Volume … is healthy. No action is needed.” It means NTFS checked the volume and found no problem with the file system.",
    body: [
      "When you investigate storage errors you can use it as a hint that the file system itself is fine. This record only confirms the file system level, though. It says nothing about the physical state of the disk (bad sectors, lifespan). If a disk problem is suspected, also check the SMART values in CrystalDiskInfo and events such as Disk 7, 11 and 153."
    ],
    conditions: ["When Windows periodically checks the volume state", "At boot or mount time"],
    causes: ["A record that the state was confirmed healthy"],
    checks: [
      "Check the CorruptionAction value (if healthy, no action).",
      "Check whether the same volume has errors other than Ntfs 55/98.",
      "When storage errors are suspected, use a volume with this record as a hint that file-system errors are unlikely."
    ],
    caution: ["It is a normal record. It does not guarantee the physical disk is healthy, so check SMART too."],
    faqs: [
      ["Does Ntfs 98 mean the disk is fine?", "It means the file system is fine. It cannot tell the physical disk state, so check SMART separately."],
      ["Is it OK if it repeats many times?", "Yes. It is written every time the volume is checked, so repeating is normal."]
    ],
    refs: [],
    related: ["ntfs-55", "ntfs-140", "disk-7"]
  },

  "ntfs-140": {
    ko: "event-ntfs-140.html",
    source: "Ntfs", id: "140", area: "Storage",
    title: "Ntfs Event 140: Transaction Log Flush Failed",
    desc: "Ntfs 140 records that NTFS could not flush data to its transaction log and warns that the volume may be damaged. Check the storage I/O path and the file system together.",
    lead: "Ntfs 140 records that NTFS could not write data to the transaction log and warns the volume may be corrupted. Look at the storage I/O path and file-system state together.",
    body: [
      "It can come with slow storage response, a lost connection or a power cut, so compare Disk events from the same time. Even if files open normally, a repeating 140 can show instability in the storage path: reduce writes and copy important data to another device before looking for the cause."
    ],
    conditions: ["A freeze or delay while saving", "During an external-disk or virtual-machine snapshot task", "Together with Ntfs 55/50 or Disk errors"],
    causes: ["Slow storage response or a lost connection", "SATA, USB or storage-controller problems", "A power cut or abnormal shutdown", "Filter-driver or virtual-storage problems"],
    checks: [
      "Back up important files first and note the event's VolumeId and DeviceName.",
      "Compare whether Disk 7, 11, 51, 98, 129 or 153 appear at the same time.",
      "Check SMART, cable, port and M.2 seating.",
      "After backing up, check the volume and device with fsutil dirty query and the maker's diagnostic tool.",
      "If it repeats, update the storage, controller and filter drivers and cross-test."
    ],
    caution: ["140 alone does not mean files are already damaged, but if it repeats, reduce writes and prioritize backup because of the risk of data loss."],
    faqs: [
      ["Does 140 mean my files are already damaged?", "It warns of possible damage, but actual damage must be confirmed by checking files and the volume. If it repeats, back up first."],
      ["Which events should I look at with it?", "Check whether Disk 7, 11, 51, 98, 129, 153, Ntfs 55/50 and storahci/stornvme events appear at the same time."]
    ],
    refs: [],
    related: ["ntfs-55", "disk-7", "storahci-129", "disk-153"]
  },

  "volsnap-36": {
    ko: "event-volsnap-36.html",
    source: "volsnap", id: "36", area: "Storage",
    title: "volsnap Event 36: Shadow Copy Storage Limit Reached",
    desc: "volsnap 36 records that a volume shadow copy was stopped because of the shadow copy storage limit. Free space on the disk and the shadow copy limit are separate things to check.",
    lead: "volsnap 36 records that a volume shadow copy was aborted because of the configured shadow copy storage limit. System Restore, Windows Backup or backup software may not be able to create new copies.",
    body: [
      "Even when the disk has plenty of free space, the dedicated limit used by restore points and backups can be too small, so check the two values separately.",
      "If you need System Restore points or backups on this PC, confirm that a substitute backup works before deleting existing copies. If storage errors appear at the same time, check the disk path and VSS state together instead of only adding space."
    ],
    conditions: ["Creating a restore point fails", "Windows Backup or backup software errors", "volsnap 36 repeats on a specific volume"],
    causes: ["The user-set maximum size of the shadow copy storage was exceeded", "Many restore points or backup jobs piled up in a short time", "I/O delay or Disk/Ntfs errors on the source volume", "VSS writer, backup provider or storage state problems"],
    checks: [
      "Note the source volume and the number of the stopped shadow copy shown in the event.",
      "Check the dedicated storage and existing copies with vssadmin list shadowstorage and vssadmin list shadows.",
      "In System Protection, check the maximum usage for that volume and whether you really need restore points.",
      "Compare VSS, Disk, Ntfs and storahci events from the same time.",
      "If you need backups, confirm a substitute backup is healthy before deleting existing recovery points."
    ],
    caution: [
      "The shadow-copy-specific limit can be too small even when the disk has plenty of free space.",
      "Running vssadmin delete shadows /all carelessly can delete existing restore points and backup copies, so check the target and your recovery plan first."
    ],
    faqs: [
      ["Why does 36 happen when drive C has plenty of free space?", "The maximum usage of shadow copies can be set separately from ordinary free space. Check the allocated limit and usage of the source volume with vssadmin list shadowstorage."],
      ["Is it OK to run vssadmin delete shadows /all?", "It can wipe all existing System Restore points and backup copies, so do not run it casually. Confirm your recovery plan and a substitute backup, then handle only the targets you need."]
    ],
    refs: [],
    related: ["disk-7", "ntfs-55", "storahci-129"]
  },

  "eventlog-6005": {
    ko: "event-eventlog-6005.html",
    source: "EventLog", id: "6005", area: "Power & shutdown",
    title: "EventLog Event 6005: Windows Start Time",
    desc: "EventLog 6005 is an informational record that the Event Log service started. It is the usual reference point for boot time and is not an error.",
    lead: "6005 is an information record that the Windows Event Log service started. It is normally used as a reference point for the boot time and does not mean an error or an abnormal shutdown.",
    body: [
      "When you look for the cause of a reboot, line up 6008, Kernel-Power 41 and User32 1074 with 6005 in time order rather than using 6005 alone."
    ],
    conditions: ["Right after Windows boots", "After the Event Log service restarts", "When comparing the time around a reboot"],
    causes: ["A normal Windows start", "An Event Log service restart", "Service initialization after an update or repair"],
    checks: [
      "Compare the 6005 time with Kernel-Power 41, EventLog 6008 and User32 1074.",
      "Check whether the boot time differs from the time you actually powered on.",
      "If it repeats in a short time, check why the Event Log service restarted and the 7000-series events."
    ],
    caution: ["6005 is in most cases a normal boot or service-start record. Do not judge the cause of a reboot from this event alone."],
    faqs: [
      ["Is it normal that 6005 is logged every time?", "Yes. It can be logged when Windows boots or when the Event Log service starts. If you see it at every normal boot with no malfunction, it is an ordinary information record."],
      ["Can 6005 tell me the boot time?", "It shows roughly when the Event Log service started. It can differ from the exact power-on time, so compare it with other start events."]
    ],
    refs: [],
    related: ["eventlog-6006", "eventlog-6008", "kernel-power-41", "user32-1074"]
  },

  "eventlog-6006": {
    ko: "event-eventlog-6006.html",
    source: "EventLog", id: "6006", area: "Power & shutdown",
    title: "EventLog Event 6006: Was the Shutdown Clean?",
    desc: "EventLog 6006 records that the Event Log service stopped during a normal shutdown. With 6006 present and 6008 absent, the shutdown was probably clean.",
    lead: "6006 is an information record that the Event Log service stopped as part of the shutdown procedure. If 6006 is present and 6008 is absent, the pattern is close to a normal shutdown.",
    body: [
      "One event alone does not confirm the power state, though. After a sudden power cut or forced shutdown, 6008 and Kernel-Power 41 may remain without a 6006. Check who requested the shutdown in User32 1074."
    ],
    conditions: ["After a normal shutdown or restart from the Start menu", "After Windows Update completes a reboot", "When comparing clean and forced shutdowns in time order"],
    causes: ["A normal shutdown or restart done by the user", "A planned reboot by Windows Update or an installer", "An administrator restarting the Event Log service"],
    checks: [
      "Compare the 6006 time with the shutdown request time in User32 1074.",
      "Check whether 6005 was recorded again in the same boot cycle.",
      "If only 6008 and Kernel-Power 41 exist without 6006, first check for a power cut or forced shutdown."
    ],
    caution: ["6006 itself is not an error. Separate whether the absence of a normal-shutdown record is the problem or whether you actually forced a shutdown."],
    faqs: [
      ["Is 6006 an error event?", "No. It is an information record left during a normal shutdown or when the Event Log service stops. The real problem is found in abnormal shutdowns without a 6006 and the events around them."],
      ["What do I learn from looking at 6006 and 6008 together?", "6006 is the record of a normal shutdown process; 6008 is an after-the-fact record that the previous shutdown was not normal. Comparing whether each exists and their times helps separate the shutdown pattern."]
    ],
    refs: [],
    related: ["eventlog-6005", "eventlog-6008", "user32-1074", "kernel-power-41"]
  },

  "tpm-wmi-1801": {
    ko: "event-tpm-wmi-1801.html",
    source: "TPM-WMI", id: "1801", area: "Security & accounts",
    title: "TPM-WMI Event 1801: Secure Boot Certificate Update Needed",
    desc: "TPM-WMI 1801 records that an updated Secure Boot certificate exists but has not yet been applied to the firmware, part of Microsoft's ongoing certificate renewal. It does not stop boot.",
    lead: "1801 records that an updated Secure Boot certificate is available but has not yet been applied to the firmware. It relates to Microsoft's ongoing rollout of renewed Secure Boot certificates, as the 2011 certificates approach expiry.",
    body: [
      "As the Windows Secure Boot CA certificates issued in 2011 near their expiry, Microsoft is distributing new certificates in stages. TPM-WMI 1801 is an advance notice that the new certificate reached the computer but is not yet reflected in the UEFI firmware (BIOS).",
      "It is closer to an informational record and does not cause boot or feature problems right now, but if left alone the PC may be unprepared at the later certificate transition, so it is safer to apply the firmware update."
    ],
    conditions: ["Repeated in the System log after Windows Update", "Piles up quietly with no visible symptom at boot", "UEFI firmware that uses the maker's certificates has not been updated for a long time"],
    causes: ["The PC is a target of the Secure Boot certificate renewal rollout under way in 2026", "The maker's firmware update for the motherboard or laptop is not yet applied", "The certificate was delivered but the firmware-application step is not complete"],
    checks: [
      "In Settings → Windows Update, check for pending updates or a pending reboot.",
      "In the update history, check whether Secure Boot–related updates were applied.",
      "On the motherboard or laptop maker's site, check for and apply the latest BIOS/UEFI firmware.",
      "Run msinfo32 and check that Secure Boot state stays “On”."
    ],
    caution: ["Do not turn Secure Boot off on your own. The certificate renewal is routine security maintenance that proceeds automatically. A power loss during a firmware update can damage the motherboard, so keep a laptop plugged in."],
    faqs: [
      ["Could my PC fail to boot now because of this event?", "No. 1801 is an advance notice that a certificate is not yet applied and does not itself cause boot failure or malfunction. Left alone it could limit Secure Boot–related features later, so applying a firmware update is advisable."],
      ["What if the maker's BIOS update is not available yet?", "Motherboard and laptop makers release updates in stages, so if there is none now, check the maker's support page now and then or wait for automatic delivery through Windows Update. There is no need to hurry."]
    ],
    refs: [],
    related: ["tpm-wmi-1040", "tpm-30", "kernel-boot-247"]
  },

  "nvlddmkm-153": {
    ko: "event-nvlddmkm-153.html",
    source: "nvlddmkm", id: "153", area: "Graphics",
    title: "nvlddmkm Event 153: NVIDIA Graphics Driver Recovery",
    desc: "nvlddmkm 153 can be logged when the NVIDIA kernel driver recovers GPU responsiveness. It is not the same as Disk 153; check the event source first.",
    lead: "nvlddmkm 153 is a system event the NVIDIA graphics kernel driver can leave while recovering the GPU's response. Its meaning differs from Disk 153, so check that the source is nvlddmkm.",
    body: [
      "It is often seen when a game shows a black screen or freezes and then recovers, but this event alone cannot confirm a failed graphics card. It is safer to separate, in order, the driver installation state, GPU temperature and power, the PCIe connection, overlays and overclocking.",
      "When you open it in Event Viewer you often see only the generic text “The description for Event ID 153 cannot be found”. That is only because the driver's message file is not registered properly and does not confirm a cause, so record the log name, the source (nvlddmkm) and the time, and compare with other events."
    ],
    conditions: ["Freeze or black screen in a game", "The screen turns off briefly and comes back", "Return to the desktop after a game closes", "LiveKernelEvent 141/117 or Display 4101 at the same time"],
    causes: ["NVIDIA driver installation or update conflicts", "Unstable GPU temperature, power or auxiliary power cables", "GPU overclock, undervolt or an unstable PCIe link", "Game overlay, hardware acceleration or security software conflicts", "A fault in the GPU or VRAM itself"],
    checks: [
      "Record the Device\\Video number and TDR wording in the event XML, the app and the driver version.",
      "If it began right after a driver update, remove the NVIDIA driver in Safe Mode and install a stable version fresh.",
      "Check GPU temperature, hot spot, power, and the 8-pin/12V connection, and restore overclock/undervolt to defaults.",
      "Compare whether it reproduces with overlays and hardware acceleration off, in another game or at default graphics settings.",
      "If it repeats, look at Display 4101, LiveKernelEvent 141/117, WHEA and Kernel-Power events from the same time, and back up important files."
    ],
    caution: [
      "Do not conclude a failed graphics card or power supply from nvlddmkm 153 alone.",
      "If you see screen corruption, a burning smell or discoloured connectors, stop load tests, unplug the power and inspect."
    ],
    faqs: [
      ["Must I replace the graphics card if nvlddmkm 153 appears?", "No. It can also be logged for driver conflicts, TDR recovery, or unstable power, temperature or PCIe link. Confirm whether it reproduces at default clocks with a stable driver, then cross-test hardware."],
      ["How do I tell it from Disk 153?", "Check the Source in Event Viewer. If it is Disk, it is a storage I/O retry; if it is nvlddmkm, it relates to the NVIDIA graphics kernel driver. The ID alone cannot separate them."],
      ["Which events should I read with it?", "Compare Display 4101, LiveKernelEvent 141/117, WHEA-Logger and Kernel-Power 41 from the same time. The priority depends on whether the screen recovered or it led to a reboot."]
    ],
    refs: [["https://learn.microsoft.com/windows-hardware/drivers/display/timeout-detection-and-recovery", `${MS}: Timeout Detection and Recovery (TDR)`]],
    related: ["display-4101", "disk-153", "whea-logger-18", "kernel-power-41"]
  },

  "service-7045": {
    ko: "event-service-7045.html",
    source: "Service Control Manager", id: "7045", area: "Security & accounts",
    title: "Service Control Manager Event 7045: A New Service Was Installed",
    desc: "SCM 7045 records that a new service or kernel-driver service was installed. It is normal for driver and security software installs, but an unknown executable path needs a security check.",
    lead: "7045 is an audit record that a new service or a kernel-driver service was installed. It is not an error; it records what was installed and when.",
    body: [
      "It is also logged normally when you install a driver or security program. Note the service name, file path, account and start type, and check that the time matches the program you installed and that the file is signed. Only a service with an unfamiliar path that appeared at an unexpected time calls for a security check."
    ],
    conditions: ["Right after installing a driver or program", "An unexpected service was created", "At the same time as a reboot or security anomaly"],
    causes: ["A normal program or driver installation", "A Windows Defender definition update", "A management tool or update task", "A program unknown to you trying to establish persistence"],
    checks: [
      "Record the service name, service file path, account and start type.",
      "Check that the time matches a program or driver you installed.",
      "Check the file signature and publisher.",
      "If it is unexpected, run a security scan and review the recent install list while keeping the network connection as it is."
    ],
    caution: [
      "7045 is an install audit record, not an error. Even a Microsoft or vendor path can have an unfamiliar name, so check the file signature and path together.",
      "Before deleting or disabling a service right away, confirm how to undo it and who installed it."
    ],
    faqs: [
      ["Is it a problem that I see many 7045 records?", "It is left each time you update a driver or install a program, so a large number is not itself a problem. The test is whether it is a service you do not remember installing."],
      ["What do I do if I find an unfamiliar service?", "Do not delete or turn it off immediately. First record the file path, signature and install time, then run a security scan."]
    ],
    refs: [],
    related: ["service-7040", "service-7000", "security-4625"]
  },

  "schannel-36874": {
    ko: "event-schannel-36874.html",
    source: "Schannel", id: "36874", area: "Security & accounts",
    title: "Schannel Event 36874: TLS Negotiation Failed",
    desc: "Schannel 36874 records that a TLS connection failed because client and server found no common protocol or cipher. Identify which app and server were involved before changing security settings.",
    lead: "36874 records that a TLS connection failed because the client and server could not find a common encryption method or protocol. First read the description to see which app failed talking to which server.",
    body: [
      "An old program, or a proxy or security appliance that does not support current TLS, or a wrong system clock that breaks certificate validation, can leave a similar record. Simply enabling TLS 1.0/1.1 to lower security is not recommended."
    ],
    conditions: ["Failure to connect to a particular website or update server", "HTTPS communication errors in an old program", "Right after a certificate or TLS setting change"],
    causes: ["A mismatch of TLS versions or cipher suites between client and server", "TLS compatibility problems of an old app, proxy or security appliance", "A certificate chain or system-time error"],
    checks: [
      "Check the Protocol, the error state and the calling process in the event.",
      "Compare with 36888 and any app or Windows Update failures from the same time.",
      "Check the system date and time, and the root certificate updates.",
      "Compare the TLS settings that the app, proxy and server support against the official documentation."
    ],
    caution: [
      "Do not enable TLS 1.0/1.1 unconditionally to lower security, and do not just hide the Schannel log.",
      "If you run the server, check both the client and server settings together."
    ],
    faqs: [
      ["How do I read 36874 and 36888 together?", "36874 is a negotiation failure and 36888 records that the handshake ended with a fatal alert, so they often appear at the same time. Do not try to fix them separately; first find which app or server is behind it."],
      ["Does enabling TLS 1.0 fix it?", "It may connect temporarily, but it lowers security. Upgrading the server or app to current TLS is the proper way; if you truly need it, check the vendor's guidance and the risk first."]
    ],
    refs: [],
    related: ["schannel-36888", "windowsupdateclient-20", "service-7045"]
  },

  "windowsupdateclient-31": {
    ko: "event-windowsupdateclient-31.html",
    source: "WindowsUpdateClient", id: "31", area: "Windows Update",
    title: "WindowsUpdateClient Event 31: Update Download Failed",
    desc: "WindowsUpdateClient 31 records that Windows Update could not download an update. Check the network, the update services and free disk space first.",
    lead: "31 records that Windows Update failed to download an update file. Unlike a failure at the install step (event 20), the download stage was blocked, so look at the network, services and storage space first.",
    body: [
      "Microsoft's older documentation says to re-establish the connection to the update server and then check in Event Viewer whether the 30, 31 and 33 records keep appearing. When the download succeeds, a success record is written to the WindowsUpdateClient log."
    ],
    conditions: ["The download stalls or shows as failed", "A VPN, proxy or security software is in use", "The same update keeps retrying"],
    causes: ["A network break or a proxy/firewall block", "The Windows Update or BITS service is stopped or in error", "A damaged download cache", "Not enough free disk space"],
    checks: [
      "Record the update name and the error code in the event body.",
      "Check the internet connection and whether a VPN or proxy is in use.",
      "Check that the Windows Update and BITS services are running.",
      "Check free disk space.",
      "Run the Windows Update troubleshooter in Settings, then try again."
    ],
    caution: [
      "Do not delete the SoftwareDistribution folder by hand during an update. If needed, stop the services and back up important files first.",
      "If the same update fails repeatedly, first record the update number (KB) and the error code."
    ],
    faqs: [
      ["How are 31 and 20 different?", "31 records that the update could not be downloaded; 20 records that a downloaded update could not be installed. The direction of the check depends on which stage was blocked."],
      ["31 keeps repeating. What do I check first?", "Check the network (including VPN and proxy), the state of the Windows Update and BITS services, and free disk space, in that order; if it still repeats, look up the update error guide with the update number and error code."]
    ],
    refs: [["https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc735613(v=ws.10)", `${MS}: Event ID 31 — WUA Update Download (Windows Server 2008 R2 documentation)`]],
    related: ["windowsupdateclient-20", "service-7000", "disk-51"]
  },

  "defender-1116": {
    ko: "event-defender-1116.html",
    source: "Windows Defender", id: "1116", area: "Security & accounts",
    title: "Windows Defender Event 1116: Malware Detected — Check 1117 for the Action",
    desc: "Windows Defender 1116 records that Microsoft Defender Antivirus detected malware or a potentially unwanted program. It is only the detection; check event 1117 for what was done.",
    lead: "Event 1116 records that Microsoft Defender Antivirus detected malware or a potentially unwanted application (PUA). It records only the detection; whether the threat was quarantined or removed is shown in the Action value of the following event 1117.",
    body: [
      "If 1116 repeats and the action in 1117 was not completed, the threat may remain on the system and be running."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If a real-time scan notification appeared, record the threat name and file path exactly as shown in it.",
        "If it was right after installing a game cheat or crack tool, it is often a genuine potentially unwanted program rather than a false positive.",
        "If you see only 1116 and no 1117, the action may not have completed yet, or policy may have set it to “Allow”."
      ]],
      ["When to check immediately", [
        "If the Action in 1117 is “Allow”, or no action is visible, and you also see unfamiliar processes, network connections or pop-ups demanding a password change, cut off the network connection and run an offline scan first."
      ]]
    ],
    conditions: ["A real-time scan notification", "Right after installing a cheat, crack or unknown tool"],
    causes: ["Malware or a potentially unwanted program", "A false positive", "An “Allow” action set by policy"],
    checks: [
      "Record the threat name, severity and detected file path from the event description.",
      "Find the 1117 event from the same time or just after it and check whether the Action is quarantine, remove, clean or allow.",
      "In Windows Security → Virus & threat protection → Protection history, check that the same item is listed.",
      "If the Action was recorded as “Allow”, review the exclusion list and organizational policy (such as ThreatSeverityDefaultAction).",
      "If you are not sure, re-check with a Microsoft Defender Offline scan."
    ],
    caution: [
      "Do not register a detected file as an exception at once just because a game or work needs it. Search the threat name on Microsoft Security Intelligence and check its real nature before deciding. Conversely, you do not need to reinstall the whole system because 1116 appeared once; check the result in 1117 first."
    ],
    faqs: [
      ["If I see only 1116 and no 1117, is the threat still there?", "It may be. 1116 means detection only; the actual quarantine or removal is recorded in the following 1117. If 1117 is missing or the action shows “Allow”, the threat may remain running, so run a full scan right away."],
      ["Do game cheats and cracks also show up as 1116?", "Yes. Cheat, crack and keygen tools classified as potentially unwanted programs are often genuinely detected rather than false positives. For a tool from an untrusted source, stopping its use is safer than registering an exception."],
      ["What if searching the threat name returns nothing?", "If you are not used to Microsoft Defender's naming conventions, search the threat name directly on the Microsoft Security Intelligence site to see the details and recommended action."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/answers/questions/1134018/distinction-between-certain-windows-defender-event", "Microsoft Q&A: Distinguishing Windows Defender events"],
      ["https://learn.microsoft.com/en-us/defender-endpoint/troubleshoot-microsoft-defender-antivirus", `${MS}: Troubleshoot Microsoft Defender Antivirus`]
    ],
    related: ["security-4625", "security-1102", "service-7045"]
  },

  "kernel-power-109": {
    ko: "event-kernel-power-109.html",
    source: "Kernel-Power", id: "109", area: "Power & shutdown",
    title: "Kernel-Power Event 109: Shutdown Transition Started",
    desc: "Kernel-Power 109 records that the kernel power manager started a shutdown or restart transition. It is informational, and is left by normal shutdowns too.",
    lead: "Kernel-Power 109 records that the kernel power manager started a shutdown (or restart) transition. It is an information record also left by a normal shutdown from the Start menu, the power button or a program's request.",
    body: [
      "The body shows the way (Action) and the reason (Reason). For example, Action “Power Action Shutdown Off” with Reason “Kernel” means the kernel started powering off by the normal procedure. One example PC logged Power Action Reboot (restart) with the reason Kernel API.",
      "When you investigate an unexpected reboot, what matters is whether this event comes before 41. If 109 is right before the shutdown and no 41 follows, it can be treated as a normal shutdown; if 41 appears without 109, it is more likely that power was cut before the shutdown transition started."
    ],
    conditions: ["When you shut down or restart Windows", "Automatic restart after Windows Update", "When you shut down with the power button"],
    causes: ["A normal shutdown or restart request", "The requester indicated by the Action and Reason values (kernel, user, program)"],
    checks: [
      "Check the Action (shutdown method) and the Reason value.",
      "Check whether Kernel-Power 41 (abnormal shutdown) followed at the same time.",
      "Compare the time with User32 1074 (who requested the shutdown)."
    ],
    caution: ["It is an informational record and not a problem alone. If neither 41 nor 6008 follows it, a normal shutdown is the right reading."],
    faqs: [
      ["Does 109 mean a normal shutdown?", "It means a shutdown transition started, so it is generally on the normal side. But if Kernel-Power 41 or EventLog 6008 followed, also check whether something went wrong during the shutdown."],
      ["What does the Reason value mean?", "It classifies who requested the shutdown: kernel, user or program. Comparing with User32 1074 from the same time narrows down who asked."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6006"]
  }
};
