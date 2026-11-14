// English editions, batch 7 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims).

const MS = "Microsoft Learn";

export const eventEn7 = {
  "deviceassociationservice-3502": {
    ko: "event-deviceassociationservice-3502.html",
    source: "DeviceAssociationService", id: "3502", area: "Applications & services",
    title: "DeviceAssociationService Event 3502: Device Unpairing Failed",
    desc: "DeviceAssociationService 3502 records that Windows tried to unpair a device and failed. It can be left when a printer or scanner connected by network or USB is removed, and often has no real effect on use.",
    lead: "DeviceAssociationService 3502 is an error-level record that Windows tried to disconnect (unpair) a device and failed. For example, if AepId starts with EsclUsb and ClientProcessName is spoolsv.exe, the print spooler could not clean up a USB-connected printer or scanner.",
    body: [
      "It often repeats at every boot because Windows tries to clean up connection information left after the device was already unplugged, and it sometimes has no effect on actual use. In Settings, remove the devices you no longer use under Printers & scanners and reinstall the driver."
    ],
    conditions: ["When a device such as a printer or scanner is removed or its connection drops", "Booting with a USB printer unplugged"],
    causes: ["Windows tries again to unpair a device that no longer exists", "The device driver or print spooler could not clean up the connection information"],
    checks: [
      "Identify the device from AepId and ClientProcessName (for example spoolsv.exe).",
      "Remove the leftover device in Settings > Printers & scanners.",
      "Check whether that device actually has a symptom of not working."
    ],
    caution: ["If the device works normally, it is usually not urgent. If it still repeats after removing it, uninstall the printer driver and reinstall it."],
    faqs: [
      ["3502 is left at every boot — is that okay?", "If the device works normally, it is usually fine. It is most likely a record of Windows failing to clean up a device that is already gone."],
      ["How can I get rid of it?", "Identify the device from AepId and ClientProcessName, remove that device in Settings > Printers & scanners, and restart. If it keeps being left, uninstall the printer or scanner driver and install the latest version again."]
    ],
    refs: [],
    related: ["print-spooler-372"]
  },

  "diagnostics-performance-100": {
    ko: "event-diagnostics-performance-100.html",
    source: "Diagnostics-Performance", id: "100", area: "Power & shutdown",
    title: "Diagnostics-Performance Event 100: Boot Time Record",
    desc: "Diagnostics-Performance 100 records how long boot took (Boot Duration) when Windows startup finished. The record itself is normal; a long value is the starting point for investigating slow startup.",
    lead: "100 is the Boot Performance Monitoring event that records the boot time when Windows startup finishes. The record itself is the result of normal operation, and when the time is long it is used as the starting point for investigating slow startup.",
    body: [
      "Events 101–110 point to concrete causes such as the apps, drivers and services that delayed startup, so read them together when the time in 100 is long.",
      "This event is not in the System log. It is left under Applications and Services Logs > Microsoft > Windows > Diagnostics-Performance > Operational. In the event log analyzer's command builder, choosing “Slow startup or shutdown” collects from this log in one go."
    ],
    conditions: ["Boot takes longer than usual", "Boot time grows longer gradually over several days", "Programs respond very late right after startup"],
    causes: ["Many startup programs and services put a heavy load right after boot", "Slow storage response (HDD, an unstable SSD)", "Delays in driver or service initialization", "Changes after a recent update or program installation"],
    checks: [
      "Divide the Boot Duration value (milliseconds) in the event by 1000 and write it down in seconds.",
      "Check which app, driver or service the 101–110 events in the same log point to.",
      "Compare the items with a high impact in the Startup tab of Task Manager.",
      "Check whether storage events such as Disk 153 and Ntfs are at the same time.",
      "Compare boot time before and after reducing startup programs. If it is still not resolved, consider the next cause."
    ],
    caution: ["Do not judge from a single boot time. The first boot after an update commonly takes long.", "The event level shown can look different depending on the environment."],
    faqs: [
      ["How do I read the Boot Duration number?", "It is in milliseconds (ms). Divide by 1000 to get seconds. The trend over several days and the increase against the usual value matter more than a single value."],
      ["100 shows as an error level — is something wrong?", "The level display can look different depending on the environment, and 100 is an event that records boot time, so it does not mean a failure by itself. Look at the time value together with the 101–110 events."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/archive/technet-wiki/11559.event-id-100-windows-diagnostics-performance", `${MS} (TechNet Wiki archive): Event ID 100 Windows Diagnostics Performance`]
    ],
    related: ["diagnostics-performance-200", "disk-153"]
  },

  "diagnostics-performance-200": {
    ko: "event-diagnostics-performance-200.html",
    source: "Diagnostics-Performance", id: "200", area: "Power & shutdown",
    title: "Diagnostics-Performance Event 200: Shutdown Time Record",
    desc: "Diagnostics-Performance 200 records how long shutdown took (Shutdown Duration) when Windows shutdown finished. When shutdown is slow, read it together with 201–203, which point to the delaying cause.",
    lead: "200 is the Shutdown Performance Monitoring event that records the shutdown time when Windows shutdown finishes. 201–203 point to the apps, devices and services that delayed shutdown, so check them together when the time in 200 is long.",
    body: [
      "This event is also not in the System log but under Applications and Services Logs > Microsoft > Windows > Diagnostics-Performance > Operational. Comparing startup and shutdown times side by side in the same log as 100 tells you whether only one side is slow or both."
    ],
    conditions: ["The shutdown or restart screen takes longer than usual", "Shutdown seems stuck because of a particular program", "Shutdown time is getting longer"],
    causes: ["An app, service or device driver that delays shutdown", "Slow storage writes", "An update being applied during shutdown"],
    checks: [
      "Divide the Shutdown Duration value (milliseconds) in the event by 1000 and write it down in seconds.",
      "Check which app, device or service the 201–203 events in the same log point to.",
      "Check which programs were running just before shutdown.",
      "Check whether storage events (Disk 153, Ntfs) are at the same time.",
      "Compare shutdown time after changing the Fast Startup setting. If it is still not resolved, consider the next cause."
    ],
    caution: ["A shutdown that applies updates is normally long. Do not judge from a single value.", "Forcing the power off during shutdown leaves an abnormal-shutdown record such as Kernel-Power 41."],
    faqs: [
      ["Shutdown is slow — can I tell which program is the cause?", "The 201–203 events sometimes point to the app, device or service that delayed shutdown. Check the name in the records at the same time, and check that program's update or shutdown settings."],
      ["How many seconds of Shutdown Duration is a problem?", "There is no fixed standard. Look at whether it grows compared with this PC's usual value and whether the same program is pointed to repeatedly."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/archive/technet-wiki/11559.event-id-100-windows-diagnostics-performance", `${MS} (TechNet Wiki archive): Event ID 100 Windows Diagnostics Performance`]
    ],
    related: ["diagnostics-performance-100", "kernel-power-41"]
  },

  "driverframeworks-10110": {
    ko: "event-driverframeworks-10110.html",
    source: "DriverFrameworks-UserMode", id: "10110", area: "Hardware errors",
    title: "DriverFrameworks-UserMode Event 10110: User-Mode Driver Failure",
    desc: "DriverFrameworks-UserMode 10110 records that the process hosting a user-mode driver had a problem and one or more devices may stop briefly. It does not confirm that a particular device has failed.",
    lead: "10110 records that the process hosting a user-mode driver had a problem and one or more devices may stop briefly. You have to check together whether a USB, audio, HID or Bluetooth device actually dropped and the UMDF error information in the XML.",
    body: [
      "It is hard to conclude a motherboard or device failure from 10110 alone. If you find the device name and InstanceId in the 10111 event at the same time, you can narrow the target of the check down to a single device."
    ],
    conditions: ["A USB, headset or Bluetooth device disappears or reconnects", "Audio cuts out or an input device stops briefly", "Right after resuming from sleep, launching a game or connecting a device"],
    causes: ["A conflict with the device driver or the manufacturer's control program", "USB hub, cable or power management problems", "Old chipset, audio or Bluetooth drivers", "The UMDF host could not reinitialize the device while resuming from sleep"],
    checks: [
      "Write down LifetimeId, Problem, ExitCode and the time from the XML.",
      "Find the device name, InstanceId and restart count in the 10111 event at the same time.",
      "Check the driver version and error state of that device in Device Manager.",
      "Cross-check with another port, cable or device without going through a hub.",
      "Update to the manufacturer's driver, or if it started right after an update, roll back and compare whether it reproduces after resuming from sleep. If it is still not resolved, consider the next cause."
    ],
    caution: ["Do not conclude a motherboard or USB controller failure from 10110 alone. The device information in 10111 and the real functional failure are the key clues.", "If a device repeats, save the files you are working on before changing drivers."],
    faqs: [
      ["Does 10110 mean my USB device is broken?", "No. Drivers, manufacturer utilities, USB hubs and sleep settings can also be causes. Check whether there is an actual drop together with the device information in 10111."],
      ["What should I look at in the XML?", "Write down the UMDF host information such as LifetimeId, Problem and ExitCode, and connect it to FriendlyName, InstanceId and RestartCount in 10111 at the same time."]
    ],
    refs: [],
    related: ["driverframeworks-10111", "kernel-pnp-219"]
  },

  "driverframeworks-10111": {
    ko: "event-driverframeworks-10111.html",
    source: "DriverFrameworks-UserMode", id: "10111", area: "Hardware errors",
    title: "DriverFrameworks-UserMode Event 10111: Device Went Offline",
    desc: "DriverFrameworks-UserMode 10111 records that a user-mode driver crash took a device offline and Windows tried to restart it. The device name and the InstanceId and RestartCount in the XML point to the target.",
    lead: "10111 records that a user-mode driver crash took a particular device offline and Windows tried to restart it. The device name on the General tab and the InstanceId and RestartCount in the XML are the most important clues.",
    body: [
      "It is often felt with HID or audio devices such as headsets, webcams, keyboards and mice, but the cause differs by device type. Separate the device, port, cable and driver one by one."
    ],
    conditions: ["A particular device disappears from Device Manager", "A headset, webcam, keyboard, mouse or USB device drops", "Right after 10110, the same device goes offline repeatedly"],
    causes: ["A conflict of that device's UMDF driver or the manufacturer utility", "USB and Bluetooth power management and resume-from-sleep problems", "Poor contact in a cable, hub or port", "Compatibility between the device firmware and the Windows build"],
    checks: [
      "Write down FriendlyName, InstanceId and RestartCount from the event XML to identify the device.",
      "Match the time with 10110 and check the order of the UMDF host error.",
      "Connect the device to another port, cable or PC to separate the device from its surroundings.",
      "Check the manufacturer's driver and firmware and the chipset driver.",
      "Compare the option to let the device be turned off in power management, and if it keeps reproducing, test with a replacement device. If it is still not resolved, consider the next cause."
    ],
    caution: ["If the device reconnected once and works normally, there is no need to replace it right away. Look at RestartCount together with whether the drops really repeat.", "InstanceId can contain identifying information about the device, so hide part of it when you share it."],
    faqs: [
      ["How are 10111 and 10110 different?", "10110 shows the UMDF host process problem, and 10111 shows the device that went offline as a result and the restart attempt. Seeing the two events as a pair makes the device easy to find."],
      ["Can I ignore it if the device works again after a restart?", "A one-off can be observed, but if RestartCount rises or the same device drops repeatedly, check the driver, firmware and power management."]
    ],
    refs: [],
    related: ["driverframeworks-10110", "kernel-pnp-219"]
  },

  "e1rexpress-27": {
    ko: "event-e1rexpress-27.html",
    source: "e1rexpress", id: "27", area: "Network",
    title: "e1rexpress Event 27: Intel Wired Link Warning",
    desc: "e1rexpress 27 records that an Intel wired network adapter lost its link or warned about the connection state. Separate the cable, switch port and driver in turn. It is a different driver record from e2fexpress 27.",
    lead: "e1rexpress 27 records that an Intel wired network adapter lost its link or warned about the connection state. It is a separate driver record with a different source from e2fexpress 27, which has the same number.",
    body: [
      "Change the cable, the wall jack, the switch port and the driver one by one and check. If it reproduces when you move the cable, a contact problem is likely. First compare whether the time of the actual drop matches the time of the record."
    ],
    conditions: ["The internet drops briefly and recovers", "The wired connection drops during a game or file transfer", "It reproduces when the cable is moved"],
    causes: ["Contact problems in the LAN cable, wall jack or switch port", "Ethernet driver, power management or speed negotiation problems", "Link instability of the router, switch or the equipment on the other end"],
    checks: [
      "Write down the link state and adapter name on the General tab and in the XML.",
      "Cross-check with another cable, port and network.",
      "Check the adapter's power management and the speed and duplex settings at their defaults.",
      "Compare whether the time overlaps with 4199, 4266 and 1014."
    ],
    caution: ["The source differs from e2fexpress 27. Check the time of the error together with the actual drop before deciding to replace the adapter."],
    faqs: [
      ["Are e1rexpress and e2fexpress the same?", "Both are Intel wired LAN driver families, but the source (driver name) differs. It can look different depending on the adapter you use, so check the source name first."],
      ["Is changing the LAN cable enough?", "Replacing the cable is the easiest first step, but also check the switch port, the adapter's power management and the speed and duplex settings."]
    ],
    refs: [],
    related: ["e2fexpress-27", "e2fexpress-32", "dns-1014"]
  },

  "e2fexpress-27": {
    ko: "event-e2fexpress-27.html",
    source: "e2fexpress", id: "27", area: "Network",
    title: "e2fexpress Event 27: Wired Network Link Drop",
    desc: "e2fexpress 27 is the record an Intel wired adapter's driver leaves when the link drops or the connection state changes. Check cable and port contact and the adapter power management setting first.",
    lead: "27 is the record the driver leaves when an Intel wired network adapter's link drops or its connection state changes. Check cable and port contact and the adapter's power management setting first.",
    body: [
      "e2fexpress is the driver of an Intel wired LAN adapter. 27 is a report that the link was lost, and the physical connection and sleep settings are the main things to check.",
      "If it happens only on a wired connection and only in one place, suspect the cable length or a connection routed through a hub before electromagnetic interference."
    ],
    sections: [
      ["Reading a link-drop record", [
        "If it is recorded only right after waking from sleep, the adapter's power management setting is the likely cause.",
        "If it is recorded irregularly during use, look at the cable or the router port first."
      ]]
    ],
    conditions: ["The LAN connection drops", "No network after resuming from sleep"],
    causes: ["The cable or the router port", "Adapter power management", "The network driver"],
    checks: [
      "Cross-check the cable and port. Change the LAN cable and plug it into a different router port. Changing the cable alone often makes it disappear, so try it first.",
      "Turn off adapter power management. In Device Manager → Network adapters → the adapter's properties → Power Management tab, clear “Allow the computer to turn off this device to save power”. This is the most effective item for drops after resuming from sleep.",
      "Fix the link speed to rule out negotiation problems. In the adapter properties → Advanced → Speed & Duplex, fix it to 1.0 Gbps Full Duplex instead of auto-negotiation. If it becomes stable after fixing, the problem was in negotiation.",
      "Replace the driver with the manufacturer's. Install the driver provided by the motherboard or laptop maker, or by Intel, instead of the one Windows installed automatically."
    ],
    caution: ["The source name can vary by adapter model."],
    faqs: [
      ["Does this event also appear on wireless Wi-Fi?", "This event occurs mainly with a wired (Ethernet) adapter's driver. A wireless adapter is recorded under a different driver source."],
      ["How do I check if it occurs only after resuming from sleep?", "Turn off the “Allow the computer to turn off this device to save power” option in the adapter's power management settings and compare whether it reproduces."]
    ],
    refs: [],
    related: ["e2fexpress-32", "e1rexpress-27"]
  },

  "e2fexpress-32": {
    ko: "event-e2fexpress-32.html",
    source: "e2fexpress", id: "32", area: "Network",
    title: "e2fexpress Event 32: Wired Network State Error",
    desc: "e2fexpress 32 records that the wired network driver reported a link or device state problem. Check the driver version and speed negotiation with the router, not only the cable and port.",
    lead: "32 is a record that the wired network driver reported a problem with the link or the device state. You have to check the driver version and speed negotiation problems with the router, not only the cable and port.",
    body: [
      "If the negotiated link speed stays lower than expected, the cable standard (Cat5e/Cat6) or aging of the port itself can also be the cause.",
      "32 is a record where the adapter reports that there is a problem with the link or device state. It often appears as a pair with 27, so looking at the times of both records together speeds up the judgment."
    ],
    sections: [
      ["Easier to judge together with 27", [
        "If it clusters only right after boot, the problem is in adapter initialization and negotiation with the router.",
        "If it clusters during large transfers, suspect cable quality or link speed negotiation."
      ]]
    ],
    conditions: ["A delay in the network connection after boot", "Drops during large transfers"],
    causes: ["The LAN cable or port", "Driver or power-saving settings", "Router negotiation problems"],
    checks: [
      "Check the event text and the adapter name. Compare the adapter name in the description with the entries in Device Manager to confirm whether it is the built-in LAN or a separate card.",
      "Compare the time with 27. If 27 is at the same time, the link really dropped. If 32 appears alone, it may be only the driver reporting the state.",
      "Check the cable standard and length. A gigabit connection needs Cat5e or better. If there is an old cable, overly long wiring, or a pressed or bent section, replace it.",
      "Check power management and the driver. Turn off the power-saving item in the adapter properties' power management, install the latest manufacturer driver, and check whether it still reproduces."
    ],
    caution: ["If only the event ID is the same but the source differs, the meaning can differ too."],
    faqs: [
      ["What should I check if it continues after I changed the cable?", "Besides the cable, also check the router port, the adapter driver version and the power-saving settings. Cross-check completely with another port and another cable."],
      ["Are events 27 and 32 the same problem?", "They are records left by the same adapter driver (e2fexpress), but the detailed state can differ. Check the specific state described in the event text together."]
    ],
    refs: [],
    related: ["e2fexpress-27", "e1rexpress-27"]
  },

  "esent-508": {
    ko: "event-esent-508.html",
    source: "ESENT", id: "508", area: "Storage",
    title: "ESENT Event 508: Write Request Delay Warning",
    desc: "ESENT 508 is a warning that a file write request sent by the Windows internal database engine (ESENT) succeeded but took an abnormally long time. It shows a storage response delay, so read it with Disk and Ntfs records.",
    lead: "ESENT 508 is a warning that a file write request succeeded but took an abnormally long time. The message gives the delay in seconds and sometimes adds wording that other I/O requests were also delayed.",
    body: [
      "Such a warning is described as possibly pointing to a storage problem, but it is also commonly left by a short I/O overload. The matching warning for slow read requests is 509. This explanation is based on event ID reference material and user reports, not on official documentation."
    ],
    conditions: ["Features that use ESENT, such as Windows Search, Defender and Update, become slow", "The system seems to stop briefly at the same time", "Storage records such as Disk 153, stornvme 129 and Ntfs are there together"],
    causes: ["A temporary I/O overload on the storage (especially an HDD)", "A problem with the storage, controller or driver", "Disk use overlapping with background work such as search indexing, antivirus scans and backups", "Storage delay in a virtual machine environment"],
    checks: [
      "Write down the file path and the delay in seconds in the event text.",
      "Compare Disk 153, stornvme 129 and Ntfs events at the same time.",
      "Check the disk usage in Task Manager at that time.",
      "Check the storage condition with SMART and the manufacturer's diagnostic tool.",
      "If it repeats, back up and then check the connection, driver and firmware. If it is still not resolved, consider the next cause."
    ],
    caution: ["A one-off 508 can be a temporary overload. Judge by whether it repeats and whether there is a symptom such as freezing.", "If a storage error is suspected, back up before checking."],
    faqs: [
      ["What is the difference between 508 and 509?", "508 is known as a record that a write request took a long time, and 509 a read request. Both point to a storage response delay."],
      ["Does it mean the SSD or HDD is broken?", "It cannot be concluded. It can also be left by a temporary load or a driver or firmware problem. Judge by the storage records at the same time and the SMART state."]
    ],
    refs: [],
    related: ["esent-509", "disk-153", "ntfs-140"]
  },
  "esent-509": {
    ko: "event-esent-509.html",
    source: "ESENT", id: "509", area: "Storage",
    title: "ESENT Event 509: Read Request Delay Warning",
    desc: "ESENT 509 is a warning that a file read request sent by the Windows internal database engine (ESENT) succeeded but took an abnormally long time. It pairs with 508, the write request, as a storage delay record.",
    lead: "ESENT 509 is a warning that a file read request succeeded but took an abnormally long time. It has the same form as 508 for write requests and records a delay on the read side.",
    body: [
      "Comparing whether it is left at the same time as 508, and whether storage records such as Disk 153 or stornvme 129 overlap, lets you judge whether it is a temporary overload or a storage problem. This explanation is based on event ID reference material and user reports, not on official documentation."
    ],
    conditions: ["Features such as Windows Search, Defender and Update become slow", "Disk usage spikes at the same time", "508 or Disk and Ntfs records are there together"],
    causes: ["A temporary I/O overload on the storage", "A problem with the storage, controller or driver", "Disk use overlapping with background work", "Storage delay in a virtual machine environment"],
    checks: [
      "Write down the file path and the delay in seconds in the event text.",
      "Compare the 508, Disk 153, stornvme 129 and Ntfs events at the same time.",
      "Check the disk usage in Task Manager at that time.",
      "Check the storage condition with SMART and the manufacturer's diagnostic tool.",
      "If it repeats, back up and then check the connection, driver and firmware. If it is still not resolved, consider the next cause."
    ],
    caution: ["A one-off 509 can be a temporary overload. Judge by whether it repeats and whether there is a symptom such as freezing.", "If a storage error is suspected, back up before checking."],
    faqs: [
      ["Only 509 repeats and there is no 508 — why?", "There are cases with only read delays. Look at the disk usage and storage records at the same time, and check the storage condition when there is a symptom."],
      ["Is it related to the Windows Search index?", "ESENT is an internal database engine used by several components such as Windows Search, so the file path in the event text tells you which feature it is."]
    ],
    refs: [],
    related: ["esent-508", "disk-153", "ntfs-140"]
  },

  "kernel-pnp-411": {
    ko: "event-kernel-pnp-411.html",
    source: "Kernel-PnP", id: "411", area: "Hardware errors",
    title: "Kernel-PnP Event 411: Device Start Problem",
    desc: "Kernel-PnP 411 records that a problem occurred while a particular device was starting. It carries the device instance ID, driver INF, service and Problem code, so first identify which device it is. It is in the Kernel-PnP/Configuration log, not System.",
    lead: "411 is a Plug and Play record that there was a problem while a device was starting. If 219 shows a driver load failure or delay, 411 records the device start problem together with the device instance and the Problem code.",
    body: [
      "This event is left under Applications and Services Logs > Microsoft > Windows > Kernel-PnP > Configuration in Event Viewer, so you cannot see it by looking only at the System log. In this site's event log analyzer, choosing “Device recognition or driver problems” in the command builder collects this log as well."
    ],
    conditions: ["A yellow exclamation mark is shown in Device Manager", "A device such as USB, a touchpad or a fingerprint reader suddenly stops working", "Right after a driver update or removal"],
    causes: ["The driver is old or damaged", "Poor contact in the device, port or cable", "A conflict with other software or drivers", "A fault in the hardware itself"],
    checks: [
      "Find that device in Device Manager with the device instance ID in the event.",
      "Write down the Problem code and the Problem Status value.",
      "Compare with the Device Manager error codes.",
      "Reinstall with the manufacturer's driver, or if it was right after a recent update, roll back to the previous version.",
      "For a USB device, change the port and remove hubs and extension cables. If it is still not resolved, consider the next cause."
    ],
    caution: ["If the device works normally now, a record left once during boot can be something to observe.", "Use the manufacturer's official release of the driver."],
    faqs: [
      ["What does the Problem code mean?", "Write down the Problem code and Problem Status value shown in the event, and look up the description of the same device in the status message in Device Manager and the error code list. Do not conclude a cause from the value alone."],
      ["The device works now but 411 remains.", "It may be a record that startup failed once during boot and then started again. If it repeats on the same device or there is a real drop, check the driver and the port."]
    ],
    refs: [],
    related: ["kernel-pnp-219", "driverframeworks-10110", "driverframeworks-10111"]
  },

  "msiinstaller-11708": {
    ko: "event-msiinstaller-11708.html",
    source: "MsiInstaller", id: "11708", area: "Applications & services",
    title: "MsiInstaller Event 11708: Installation Failed",
    desc: "MsiInstaller 11708 records that a Windows Installer (MSI) installation failed. The product name is in the event, and the actual error status value is in the MsiInstaller 1033 record at the same time.",
    lead: "11708 is a record that a Windows Installer installation failed. It tells you only which product it was, not the reason. The status value that is the reason is in 1033 at the same time, so read the two records as a pair.",
    body: [
      "The cause differs by product. Common causes such as permission problems, leftovers of a previous installation and file locks are known, but it is confirmed in the detailed log. The action just before the line where Return value 3 is recorded in the detailed log is the step that failed."
    ],
    conditions: ["“Installation failed” or a rollback is shown during program installation or update", "The setup wizard shows a code such as error 1603", "MsiInstaller 1033 is left at the same time"],
    causes: ["Insufficient permissions (running an installation that needs administrator rights with ordinary rights)", "Leftovers of a previous installation or damaged installation information", "A running program locks a file", "A damaged installation package or unmet installation conditions"],
    checks: [
      "Check the status value of MsiInstaller 1033 at the same time (1603 is a general code meaning a fatal error during installation).",
      "Run the installer again with administrator rights.",
      "Create a detailed log with msiexec /i package.msi /l*v logfile.txt and check the part before the line that says Return value 3.",
      "Remove the previous version and reinstall.",
      "Check the installation requirements the manufacturer gives (required components, versions). If it is still not resolved, consider the next cause."
    ],
    caution: ["Do not turn off security software and run an installation file from an unreliable source.", "Back up before you delete installation information in the registry directly."],
    faqs: [
      ["How are 11708 and 1033 connected?", "They are left together at the same time. 1033 holds the installation result status value, and 11708 records the fact that the installation task failed. If the status value is 1603, it is a general code meaning a fatal error occurred during installation."],
      ["How do I create a detailed log?", "Run something like msiexec /i package.msi /l*v logfile.txt in a Command Prompt with administrator rights, and the installation process is recorded in detail in the log file. The file can contain paths and user names, so check it before sharing."]
    ],
    refs: [],
    related: ["msiinstaller-1033"]
  },

  "resource-exhaustion-2004": {
    ko: "event-resource-exhaustion-2004.html",
    source: "Resource-Exhaustion-Detector", id: "2004", area: "Applications & services",
    title: "Resource-Exhaustion-Detector Event 2004: Low Virtual Memory",
    desc: "Resource-Exhaustion-Detector 2004 is a warning that Windows diagnosed the system's virtual memory or commit limit as running low. Check the commit size and page file, not just RAM usage.",
    lead: "2004 is a warning that Windows diagnosed the system's virtual memory and commit limit as running low. The event description can show the processes using the most commit at the time, so look at the commit size and the page file together, not only RAM usage.",
    body: [
      "If the commit usage keeps rising the longer a particular program runs, you can suspect a leak in the app or a plug-in. If it occurs in several programs at the same time, first check the page file and the free space on the system drive."
    ],
    conditions: ["A program suddenly closes or stops responding", "Memory runs out after running a game, browser or virtual machine for a long time", "Commit usage in Task Manager is close to the limit"],
    causes: ["A virtual memory leak in a particular program or service", "The page file is off or its size is limited too much", "Running several large programs at once exceeded the commit limit", "A RAM shortage together with increased page file use"],
    checks: [
      "Write down the top memory-using processes and amounts at the time from the event description.",
      "Check the commit usage and the commit limit in Task Manager's Performance > Memory.",
      "Check whether the page file in Settings is automatically managed and the free space on the system drive.",
      "In Task Manager, compare whether the same program keeps increasing its commit each time it is run again.",
      "Split the reproduction by updating the program, removing plug-ins and restarting, and consider a memory diagnostic if it repeats in several apps. If it is still not resolved, consider the next cause."
    ],
    caution: ["2004 does not immediately mean bad RAM. Check the process the event points to and the commit size first.", "Continuing heavy work under a memory shortage can lose unsaved data, so save your work first."],
    faqs: [
      ["Do I need to add RAM when 2004 appears?", "Not necessarily. A virtual memory leak in a particular program or a page file limit can be the cause. First check the commit usage of the process the event points to."],
      ["Which value should I look at in Task Manager?", "On the Performance tab, check the commit usage and commit limit in the Memory item. Looking only at the memory column on the Processes tab can miss the cause of virtual memory exhaustion."]
    ],
    refs: [],
    related: []
  },

  "schannel-36888": {
    ko: "event-schannel-36888.html",
    source: "Schannel", id: "36888", area: "Network",
    title: "Schannel Event 36888: TLS Fatal Alert",
    desc: "Schannel 36888 records that a fatal alert occurred during the TLS handshake and the secure connection ended. If it appears with 36874, first check whether it is the result of a failed negotiation.",
    lead: "36888 is a record that a fatal alert occurred during the TLS handshake and the secure connection ended. It often records the result of a connection failure, so it does not tell the cause on its own.",
    body: [
      "Write down the fatal alert number and the internal error state in the event description, and match the time against 36874, app errors and Windows Update failures. If it is only in a particular app, first check that app's range of TLS and certificate support."
    ],
    conditions: ["HTTPS sign-in or sync fails", "Connection errors in a browser or background service", "Repeats at the same time as 36874"],
    causes: ["A TLS fatal alert sent by the remote server", "An unsupported TLS protocol or cipher suite", "A wrong certificate, a proxy or inspecting security software"],
    checks: [
      "Write down the fatal alert number and the internal state code.",
      "Compare the times of 36874, app errors and Windows Update errors.",
      "Check the system time, certificates and proxy settings.",
      "If the problem is only in a particular app, first check that app's range of TLS and certificate support."
    ],
    caution: ["Event 36888 can be the result of a connection failure, so do not judge a malicious attack or a PC failure from it alone."],
    faqs: [
      ["Does 36888 mean I have been hacked?", "There is no basis for judging that. It is a connection failure record that is also commonly left by server-side settings or an old app or proxy. Do a security check only when unfamiliar connections or other security anomalies are there too."],
      ["How do I find the cause?", "Check in order which program failed to communicate at the same time, and whether the system time and certificate state are normal."]
    ],
    refs: [],
    related: ["schannel-36887", "dns-1014"]
  },

  "tpm-30": {
    ko: "event-tpm-30.html",
    source: "TPM", id: "30", area: "Security & accounts",
    title: "TPM Event 30: Security Chip State Record",
    desc: "TPM 30 is a record the TPM provider or management component leaves while handling the security chip's state, keys and features. When Windows Hello, BitLocker or Secure Boot problems are there too, check the detailed message and firmware state.",
    lead: "TPM 30 is a record the TPM provider or management component leaves while processing the security chip's state, keys and functions. First separate whether there is a real problem with Windows Hello or BitLocker, or it is a one-off state record.",
    body: [
      "If it started after a motherboard replacement or a BIOS update, check the firmware settings, including Intel PTT and AMD fTPM. It is safer to leave actions that reset the TPM as the last step, after you have secured the recovery key."
    ],
    conditions: ["While setting up or using a sign-in PIN or Windows Hello", "After the BitLocker protection state changed", "After a BIOS update, a TPM setting change or a motherboard replacement"],
    causes: ["A problem with the BIOS/UEFI TPM, Intel PTT or AMD fTPM settings or firmware", "A mismatch of TPM ownership, provisioning or the Windows Hello key state", "A temporary error in the TPM WMI provider or a related Windows component"],
    checks: [
      "Write down the error state, command and TPM version information from the General tab and the XML.",
      "Check the TPM ready state and protection state with tpm.msc and PowerShell Get-Tpm.",
      "Check the motherboard maker's BIOS and chipset updates and TPM-related change notes.",
      "Consider resetting the TPM only after you have secured the BitLocker recovery key and another way to sign in.",
      "If there is no problem with Windows Hello or BitLocker, first observe whether it is a one-off record and whether it repeats. If it is still not resolved, consider the next cause."
    ],
    caution: ["Clearing the TPM can cause trouble accessing the drive without the BitLocker recovery key. Do not reset it before you have checked the recovery key.", "Do not conclude a TPM chip failure or a security breach from event 30 alone."],
    faqs: [
      ["Does TPM 30 mean the TPM is broken?", "No. You have to check whether there is a failure of Windows Hello or BitLocker together with the detailed error state in the event. Do not judge a chip failure from a one-off record."],
      ["Can I reset the TPM right away?", "First secure the BitLocker recovery key and another way to sign in. If you clear the TPM without checking the key, problems can occur with the encrypted drive or PIN sign-in."]
    ],
    refs: [],
    related: ["tpm-15", "tpm-wmi-1040", "tpm-wmi-1801"]
  },

  "winsrvext-100": {
    ko: "event-winsrvext-100.html",
    source: "winsrvext", id: "100", area: "Applications & services",
    title: "winsrvext Event 100: Session and Server Component Record",
    desc: "winsrvext 100 is a record the winsrvext extension component leaves during Windows server and session work. The ID alone does not settle its meaning; read the General tab text and the XML together.",
    lead: "winsrvext 100 is a record that the Windows server and session extension component leaves while working. The detailed message of this source can differ by Windows version and server role, so look at the Message, Task and session information in the General tab and the XML, not only the event ID.",
    body: [
      "If there is no Remote Desktop disconnection or sign-in delay, it may be a one-off informational record. Only when there is a real functional failure, compare the time with TerminalServices and service events to narrow the cause."
    ],
    conditions: ["After a Remote Desktop or terminal session connected or ended", "While using a server role or session-based features", "A one-off record in the system log without a functional failure"],
    causes: ["A temporary state record of the Windows session or Remote Desktop extension component", "A change in the server role, RDS configuration or related services", "A compatibility problem with a recent Windows update, driver or session management program"],
    checks: [
      "First write down the Message, Task, session and computer role information from the General tab and the XML.",
      "Compare with Remote Desktop, TerminalServices and Service Control Manager events at that time.",
      "Check whether there is a real sign-in or remote session drop or an app launch failure.",
      "If you use a server role or RDS, check the related service state and recent updates.",
      "If it is a one-off without symptoms, observe whether it repeats and whether it affects functions rather than acting. If it is still not resolved, consider the next cause."
    ],
    caution: ["The detailed meaning of winsrvext 100 can differ by configuration and Windows version. Do not judge a hardware failure or a security problem from the event ID alone."],
    faqs: [
      ["Does winsrvext 100 mean the server or hardware is broken?", "No. It can be a state record of a server or remote session component. Check whether the times of real remote access, sign-in and session failures and the repeats match."],
      ["What if the General tab shows no special description?", "Copy the Provider, Task, Message and session or computer role fields from the XML view on the Details tab and analyze them together. It is hard to settle the meaning of this event from the ID alone."]
    ],
    refs: [],
    related: []
  },

  "wlan-autoconfig-8002": {
    ko: "event-wlan-autoconfig-8002.html",
    source: "WLAN-AutoConfig", id: "8002", area: "Network",
    title: "WLAN-AutoConfig Event 8002: Wireless Connection Failed",
    desc: "WLAN-AutoConfig 8002 records that the WLAN AutoConfig service could not connect to a wireless network. The Failure Reason in the event sets the direction of the check.",
    lead: "8002 is a record that connecting to a wireless network failed, and the failure reason is left with it. Even for the same event, the direction of the check differs completely depending on whether the reason is a key mismatch, no network, or a driver problem.",
    body: [
      "This event is not in the System log but under Applications and Services Logs > Microsoft > Windows > WLAN-AutoConfig > Operational. Seeing it with 8001 (connection succeeded) and 8003 (disconnected) in the same log shows the flow of since when it dropped."
    ],
    conditions: ["Wi-Fi repeatedly connects and drops", "It does not connect even when you enter the password", "A connection failure right after changing the router or updating a driver"],
    causes: ["A mismatch of the password (security key)", "The network is out of range or unavailable", "A wireless adapter driver problem (for example, the failure reason is “The driver disconnected while associating”)", "A change in the router's security method or channel settings"],
    checks: [
      "Write down the Failure Reason sentence in the event.",
      "Delete the saved network and connect again after entering the password.",
      "Update the wireless adapter driver to the latest manufacturer version, or roll back to the previous one.",
      "Compare whether other devices also fail to connect to the same router.",
      "Restart the router and check the security method setting (WPA2/WPA3). If it is still not resolved, consider the next cause."
    ],
    caution: ["If it fails on all devices, suspect the router or the line before the PC.", "Do not post your Wi-Fi password or the router administrator information in a help request."],
    faqs: [
      ["If the Failure Reason says key mismatch, is it a password problem?", "Usually it means the password or the security method does not match. Delete the saved network and connect again after entering the password."],
      ["What does “The driver disconnected while associating” mean?", "It means the wireless adapter driver disconnected during the connection setup, which is a clue to suspect the driver or adapter. Update the driver, or roll it back to the previous version and compare."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc735927(v=ws.10)", `${MS}: Event ID 8002 — 802.11 Wireless Connectivity (Windows Server 2008 R2 documentation)`]
    ],
    related: ["e2fexpress-27", "dns-1014"]
  }
};
