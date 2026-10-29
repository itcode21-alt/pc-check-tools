// English editions, batch 4 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims).

const MS = "Microsoft Learn";

export const eventEn4 = {
  "defender-1117": {
    ko: "event-defender-1117.html",
    source: "Windows Defender", id: "1117", area: "Security & accounts",
    title: "Windows Defender Event 1117: Action Taken Against a Threat",
    desc: "Windows Defender 1117 records what action Defender actually took on a threat detected in 1116. The Action value decides whether the threat was removed or allowed to run.",
    lead: "Event 1117 records what action Defender actually carried out on the threat detected earlier in event 1116. Always read 1116 and 1117 as a pair to see the real outcome.",
    body: [
      "If the Action value is quarantine, remove or clean, the threat was handled normally and you only need to confirm the result in the quarantine list. If it says “Allow”, the threat was not quarantined or removed and was allowed to run as it was.",
      "If the message says a restart is required, the action finishes only after the next restart, so the threat may remain until then."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If Action is quarantine, remove or clean, the threat was handled normally; just do a final check in the quarantine list.",
        "If Action is “Allow”, an exclusion or a policy may have let the threat run, and it needs an immediate review.",
        "If a restart is required, the action completes after the next restart, so the threat may remain until then."
      ]]
    ],
    conditions: ["Right after a threat was detected (1116)", "A restart is required to finish the action", "Action recorded as “Allow”"],
    causes: ["Defender quarantined, removed or cleaned the threat", "An exclusion or policy allowed the threat to run", "The action is waiting for a restart to finish"],
    checks: [
      "In the event description, check the Action value, the name of the threat and the file path.",
      "In Windows Security → Virus & threat protection → Protection history, confirm the status of the same item.",
      "If Action is “Allow”, review the exclusion list and the real-time protection and cloud-delivered protection settings.",
      "Items in quarantine can be permanently deleted once they are confirmed safe; if you suspect a false positive, search for the threat name and re-check before deciding whether to restore.",
      "If a restart is needed, run Microsoft Defender Offline after the restart and confirm that the threat is completely gone."
    ],
    caution: [
      "Do not leave an item marked “Allow” alone without checking it. Unless it is a false positive on software you trust, the threat may be running.",
      "Do not take drastic steps such as reinstalling the whole system just because a quarantine or removal was recorded as completed normally.",
      "If Action keeps showing “Allow”, or strange processes, network connections or account problems continue after the action completed, disconnect the network and run a Microsoft Defender Offline scan first."
    ],
    faqs: [
      ["What does it mean when Action is recorded as “Allow”?", "It means the detected threat was allowed to run instead of being quarantined or removed. Unless you deliberately excluded a trusted program as a false positive, an “Allow” left on an unfamiliar program is a warning that the threat is still on the system, so review the exclusions and policies immediately."],
      ["Is it safe to delete a quarantined file?", "After checking the item in Protection history in Windows Security you can delete it permanently. If you suspect a legitimate file was flagged by mistake, search for the threat name and check what it really is before deleting."],
      ["What if the symptoms continue even though the action completed?", "Even if 1117 shows the action as completed, the file may need a restart or other malicious components may remain. Run an offline scan with Microsoft Defender Offline before the restart and check again that it is completely removed."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/answers/questions/1134018/distinction-between-certain-windows-defender-event", "Microsoft Q&A: Distinction between certain Windows Defender events"],
      ["https://learn.microsoft.com/en-us/defender-endpoint/troubleshoot-microsoft-defender-antivirus", `${MS}: Troubleshoot Microsoft Defender Antivirus`]
    ],
    related: ["defender-1116", "security-4625", "security-4740", "security-1102"]
  },

  "defender-5007": {
    ko: "event-defender-5007.html",
    source: "Windows Defender", id: "5007", area: "Security & accounts",
    title: "Windows Defender Event 5007: Security Settings Changed",
    desc: "Windows Defender 5007 records that a Microsoft Defender Antivirus setting changed. It also appears after updates and normal switches, but an unexpected real-time protection or exclusion change needs a security check.",
    lead: "5007 records that a Microsoft Defender Antivirus setting was changed. The event keeps the old value and the new value, so you can see which setting changed.",
    body: [
      "It is also logged after Defender updates and normal protection switches. If the change affects real-time protection or the exclusion list and you did not expect it, compare it with the settings in Windows Security and run a scan. The existence of a 5007 alone does not mean malware."
    ],
    conditions: ["Right after a Defender update", "After real-time protection or controlled folder access settings were changed", "Right after a security program was installed or removed"],
    causes: ["A Defender platform or security-intelligence update", "A settings change by an administrator or organisation policy", "A protection switch caused by installing a third-party antivirus", "An unwanted program changing security settings"],
    checks: [
      "Check which setting actually changed from the Old value and the New value. Start with what is easy to undo so you can narrow the range without risk.",
      "Compare it with the Virus & threat protection settings in Windows Security. Compare with the first check to narrow the cause candidates.",
      "If the change was unexpected, consider a full scan and an offline scan. If it still reproduces at this step, move on to the next item.",
      "Check events 5001, 5004 and 1002 at the same time and any recent installs or policy changes. See whether the symptoms differ before and after the change."
    ],
    caution: [
      "A 5007 on its own does not mean malware. Check whether the change matches your own work and the update time.",
      "Do not “fix” it by turning protection off or clearing Defender events."
    ],
    faqs: [
      ["5007 appears several times a day. Is that normal?", "It can be logged whenever Defender updates or switches state. Check whether the Old value and New value are a really meaningful change of setting."],
      ["What if protection had been turned off?", "Another antivirus may have been installed or a policy may have changed it, so check the install history and any organisation policy first. If you do not recognise the change, run a full scan."]
    ],
    refs: [],
    related: ["defender-1116", "security-4625", "security-4740", "security-1102"]
  },

  "disk-157": {
    ko: "event-disk-157.html",
    source: "Disk", id: "157", area: "Storage",
    title: "Disk Event 157: Disk Was Surprise Removed",
    desc: "Disk 157 records that the operating system detected a disk being removed without a shutdown procedure. It is usually an external drive pulled without safe removal or a connection that dropped for a moment.",
    lead: "157 records that the operating system detected a disk being removed without a shutdown procedure. In most cases an external drive was unplugged without safe removal, or the connection dropped for a moment.",
    body: [
      "If it appears on an internal drive, safe removal is irrelevant; check the power supply, a poor SATA or M.2 contact, and whether a flat battery forced a shutdown."
    ],
    conditions: ["An external drive was suddenly disconnected", "Power was cut while a USB device was connected", "A laptop was forced off by a flat battery"],
    causes: ["The device was removed without safe removal", "A poor USB cable contact", "A flat battery or a power error"],
    checks: [
      "Always use safe removal for external devices. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the state of the cable and the port. Compare with the first check to narrow the cause candidates.",
      "Check the file system for damage (chkdsk). Use this to verify the next cause when the earlier steps did not solve it."
    ],
    caution: ["A forced removal may have damaged files. Check the important files first."],
    faqs: [
      ["Can 157 remain even though I used safe removal?", "Normally it does not remain if you went through the safe-removal procedure. If it does, the connection may already have dropped during removal, or the device was unplugged before the procedure finished."],
      ["What should I check if it repeats on an internal drive?", "If it is not an external device, suspect unstable power delivery or a poor SATA or M.2 slot contact. Check the cable and power connectors first."]
    ],
    refs: [],
    related: ["disk-158", "ntfs-50", "ntfs-55", "ntfs-57", "ntfs-140"]
  },

  "disk-158": {
    ko: "event-disk-158.html",
    source: "Disk", id: "158", area: "Storage",
    title: "Disk Event 158: Duplicate Disk Identifier",
    desc: "Disk 158 shows that two or more disks use the same identifier or GUID. It is mainly seen with cloned VHDs, multipath storage and USB external disks.",
    lead: "Disk 158 is a warning that two or more disks use the same identifier or GUID. It can appear with cloned VHDs, storage exposed over several paths without MPIO, and some external-disk setups; by itself it does not mean a physical disk failure.",
    body: [
      "First check UniqueId and the disk layout with Get-Disk to tell whether really different devices are duplicates or the same device is visible over several paths. Changing an identifier or initialising a disk risks data loss, so a backup and confirmation of the target are needed."
    ],
    conditions: ["After a disk was added or cloned", "Several external disks or VHDs are connected", "Disk numbers or volume identification differ from what you expect"],
    causes: ["A copied VHD keeps the same disk identifier", "The same physical disk is exposed over several paths without MPIO", "Identifier duplication during storage or virtual-disk cloning"],
    checks: [
      "Check Number, FriendlyName and UniqueId in Get-Disk. Start with what is easy to undo so you can narrow the range without risk.",
      "If it is one device over several paths, check the MPIO and storage configuration. Compare with the first check to narrow the cause candidates.",
      "If it is a cloned VHD, tell the original from the copy and consider Set-VHD -Path <path> -ResetDiskIdentifier. If it still reproduces at this step, move on to the next item.",
      "For USB external disks, remove them safely and connect them one at a time to see which device triggers it. See whether the symptoms differ before and after the change.",
      "Before changing a duplicate identifier by hand, make a backup and be sure of the target disk. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "158 does not necessarily mean a disk failure or poor performance. Tell the duplicate-identifier warning apart from a real I/O failure.",
      "Changing the identifier with diskpart or an initialisation command can lose data, so do not run it without confirming the target."
    ],
    faqs: [
      ["Do I need to replace the disk when 158 appears?", "No. A duplicate-identifier warning and a physical failure are separate things. Check whether real I/O errors or access failures appear together."],
      ["What should I do if it appears after cloning a VHD?", "Tell the original from the copy, then consider Set-VHD -Path <path> -ResetDiskIdentifier in a Hyper-V environment. Do not run diskpart or an initialisation command without confirming the target."]
    ],
    refs: [],
    related: ["disk-157", "ntfs-50", "ntfs-55", "ntfs-57", "ntfs-140", "storahci-129"]
  },

  "disk-98": {
    ko: "event-disk-98.html",
    source: "Disk", id: "98", area: "Storage",
    title: "Disk Event 98: Volume Check Needed, Storage Errors",
    desc: "Disk 98 records that a volume must be taken offline for a full CHKDSK. Check whether file-system corruption or a storage I/O problem is also present, and back up first.",
    lead: "Disk 98 records that a volume must be taken offline and a full CHKDSK run. It can come from NTFS corruption but also from storage I/O failures or connection-path problems, so back up before you run a check.",
    body: [
      "Identify the volume and disk number shown in the event, then compare whether Disk, Ntfs and storahci events appear at the same time. That helps separate a file-system problem from a physical storage problem.",
      "If it is clustered right after a restart: when this record repeats right after Kernel-Power 41 or EventLog 6008 (unexpected shutdown), the storage may not be the cause; it may be the result of a sudden power cut. If power is cut during a write, NTFS cannot finish the operation and leaves the trace for the next boot.",
      "To tell them apart: if BugcheckCode is 0 in the details of Kernel-Power 41 and there are no blue-screen records (BugCheck, WER 1001) and no WHEA-Logger events in the same period, the system did not crash; the power was cut, so check the power system first. Repeating the check alone will not stop the damage from coming back."
    ],
    conditions: ["Windows scheduled a disk check", "File-system errors or delays accessing a volume", "Disk and Ntfs errors repeat at the same time"],
    causes: ["File-system corruption from an abnormal shutdown or a failed write", "Bad sectors or I/O completion failures on the storage device", "A problem with the storage controller, the cable or a filter driver"],
    checks: [
      "Before checking, back up important data to another storage device. Start with what is easy to undo so you can narrow the range without risk.",
      "Identify the volume and the disk shown in the event. Compare with the first check to narrow the cause candidates.",
      "Check the dirty state with fsutil dirty query <drive>:. If it still reproduces at this step, move on to the next item.",
      "After the backup, run chkdsk /f or a check following the manufacturer's guidance when needed. See whether the symptoms differ before and after the change.",
      "Compare Disk 7, 11, 51, 129 and 153 and Ntfs 55 and 140 by time. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "Running check or repair commands first on an unstable disk can add write load. The backup comes first.",
      "A general lack of free space and file-system corruption are different problems, so do not assume that freeing space alone fixes it."
    ],
    faqs: [
      ["Should I run chkdsk right away when 98 appears?", "Back up important files first. Running repair commands on an unstable storage device can add write load."],
      ["Is it a low-free-space error?", "No. Low free space and file-system corruption or a dirty volume are different problems. Check fsutil dirty query and the health of the storage device separately."]
    ],
    refs: [],
    related: ["disk-157", "disk-158", "disk-153", "disk-154", "ntfs-50"]
  },

  "dns-1014": {
    ko: "event-dns-1014.html",
    source: "DNS Client Events", id: "1014", area: "Network",
    title: "DNS Client Events 1014: Name Resolution Timed Out",
    desc: "DNS Client Events 1014 records that a DNS name-resolution request did not get an answer within the timeout. It often accompanies slow sites or launchers and Windows Update that cannot find servers.",
    lead: "1014 records that a DNS name-resolution request did not get an answer within the timeout. In Event Viewer the source may show as DNS Client Events or Microsoft-Windows-DNS-Client. It often appears with symptoms such as only some sites being slow, or a game launcher or Windows Update failing to find its server.",
    body: [
      "This event alone cannot tell you that the internet line or the network card is faulty. Compare the QueryName (the domain looked up) and the time with the time the connection really failed, and compare the answers of the default DNS server with another DNS server to narrow the cause."
    ],
    sections: [
      ["Name-resolution delay is not the same as a dropped connection", [
        "1014 means that turning a domain name into an IP address did not finish within the timeout. That is different from the line itself being down.",
        "If a site does not open by its address but does open by IP, it is a typical name-resolution problem.",
        "If the domain names in the records are concentrated on a particular service, suspect that service or the filter of a security program."
      ]]
    ],
    conditions: ["Websites open slowly", "Right after switching Wi-Fi"],
    causes: ["A DNS server delay or a temporary failure to answer", "A DNS cache or routing problem on the router or the ISP line", "The influence of a DNS filter in a VPN, proxy or security program", "The wireless driver still preparing the connection right after wake from sleep"],
    checks: [
      "Narrow the scope: is it only this PC? See whether other devices on the same router (a phone, for example) are also slow on the same site. If the other devices are slow too, it is a router or line problem and there is no need to touch the PC settings.",
      "Check whether the same domain is also slow on other devices on the same router. If it is slow on all devices, check the router, the line and the DNS service before the PC.",
      "Flush the DNS cache: run ipconfig /flushdns in an administrator command prompt, then compare the default DNS response time with nslookup example.com.",
      "Compare DNS server answers: in PowerShell run Resolve-DnsName example.com and Resolve-DnsName example.com -Server 1.1.1.1. If only one server is slow, suspect the DNS server or a difference in the router settings.",
      "Compare with a public DNS: temporarily change the DNS in the adapter settings to 1.1.1.1 or 8.8.8.8 and see whether it still reproduces. Note the original DNS address first, and on a company or school network check the administrator policy first.",
      "Check VPN and security-program filters: a web filter in a VPN or an internet security product can intercept name resolution and cause delays. Disconnect it briefly to see whether it still reproduces, and turn protection back on once solved.",
      "Compare related events: check DHCP-Client 1001, Tcpip 4199 and 4266 and WLAN-AutoConfig events at the same time. If you see a 169.254.x.x address or DHCP failures, check the IP and gateway before DNS."
    ],
    caution: ["If the internet is fine and it was a one-off, do not treat it as a hardware failure."],
    faqs: [
      ["If only one site opens slowly, is this event the reason?", "A DNS resolution delay can affect only a particular domain. If other sites are fine and only one is slow, the server of that site itself may be the problem."],
      ["Does restarting the router fix it?", "If it is a temporary DNS cache or routing problem, a router restart often fixes it. If it repeats, change the DNS server address and compare."]
    ],
    refs: [],
    related: ["dhcp-client-1001", "tcpip-4199", "tcpip-4266", "wlan-autoconfig-10002"]
  },

  "dhcp-client-1001": {
    ko: "event-dhcp-client-1001.html",
    source: "DHCP-Client", id: "1001", area: "Network",
    title: "DHCP-Client Event 1001: IP Address Lease Failed",
    desc: "DHCP-Client 1001 records that the DHCP client could not lease or renew an IP address. Do not assume DNS because the internet is down; check IP and gateway assignment first.",
    lead: "1001 records that the DHCP client could not obtain or renew an IP address. With this record, look first at whether the IP address and the default gateway were assigned correctly, before DNS.",
    body: [
      "A 169.254.x.x address is the automatic private IP address Windows assigns temporarily when it gets no DHCP answer. Comparing whether other devices on the same router get an IP quickly shows whether the problem is on the PC or on the router or line."
    ],
    conditions: ["No internet connection after boot", "The IP shows as 169.254 after switching between Wi-Fi and wired", "The network drops after wake from sleep"],
    causes: ["The router or DHCP server failed to answer", "An unstable LAN cable or wireless link", "The network adapter driver or its power-saving settings", "A conflict with a VPN or virtual network adapter"],
    checks: [
      "Check IPv4, the default gateway and the DHCP server address in ipconfig /all. Start with what is easy to undo so you can narrow the range without risk.",
      "Compare whether other devices on the same router also get an IP. Compare with the first check to narrow the cause candidates.",
      "Turn the adapter off and on, then run ipconfig /release and ipconfig /renew. If it still reproduces at this step, move on to the next item.",
      "Cross-check with another cable and port and the latest network driver. See whether the symptoms differ before and after the change."
    ],
    caution: ["If you see a 169.254.x.x address, check the DHCP side, the cable and the router before changing DNS."],
    faqs: [
      ["What does it mean when the IP starts with 169.254?", "Windows could not get an address from a DHCP server and assigned a temporary one. The internet does not work with this address, so check the cable, the router and the adapter before changing DNS."],
      ["Are ipconfig /release and /renew safe?", "They drop the connection briefly and obtain a new address, so they are generally safe. If you are connected remotely the connection may drop, so run them at the PC."]
    ],
    refs: [],
    related: ["dns-1014", "wlan-autoconfig-10002", "tcpip-4266"]
  },

  "volmgr-162": {
    ko: "event-volmgr-162.html",
    source: "Volmgr", id: "162", area: "Power & shutdown",
    title: "Volmgr Event 162: Random Shutdowns and Reboots",
    desc: "Volmgr 162 is the volume manager's record of the result (success or failure) of creating a dump file after a crash. In practice it often appears with unexpected shutdowns and reboots.",
    lead: "162 is the volume manager's record of the result of creating a crash dump file. Even when the message says the dump file was created successfully, the level is still shown as an error, because the real point of the record is that there was an abnormal shutdown just before.",
    body: [
      "In practice it often appears with an unexpected reboot or a random power-off, so it is used as a clue to narrow the cause of the shutdown. In most cases the event is not the cause but a by-product of the shutdown.",
      "If the pattern is fine for several days and then reproduces in a cluster, suspect intermittent instability of the power supply itself before a dump-creation failure. Looking at it together with Kernel-Power 41 and WHEA events at the same time brings you closer to the real cause."
    ],
    sections: [
      ["What happened with 162 matters more than 162 itself", [
        "162 records the result of creating a crash dump file, whether it succeeded or failed. The fact that a dump was attempted means the system shut down abnormally just before, so what you really investigate is that event, not 162.",
        "If no dump is left, analysing the cause becomes difficult, so a goal of this page is also to normalise the page file and dump settings so that a dump is kept next time."
      ]]
    ],
    conditions: ["After a sudden reboot or a forced shutdown", "After the power went off randomly, days apart"],
    causes: ["Unstable power supply (PSU)", "An old motherboard chipset driver", "Too little disk space or too small a page-file setting to save the dump file"],
    checks: [
      "Check the interruption event at the same time: look at Kernel-Power 41 and the WHEA records together. 162 is the result, and the event is what you investigate.",
      "Check the page-file setting: in Settings → System → About → Advanced system settings → Performance Settings → Advanced → Virtual memory, see whether automatic management is on. If there is no page file or it is too small, a dump cannot be created.",
      "Make room for the dump: if free space on the system drive is low, dump creation fails. Keep at least several GB free.",
      "Update the chipset and storage drivers: bring the motherboard maker's chipset driver and the storage driver up to date, because they are components involved in the dump-writing path."
    ],
    caution: ["This event alone does not confirm the cause. Compare it with other hardware events that appeared together."],
    faqs: [
      ["Does Volmgr 162 mean the storage device has failed?", "It is closer to a record that dump creation failed at the time of an unexpected shutdown than a storage problem. Instead of concluding it is a storage problem, check other events at the same time (Kernel-Power, WHEA)."],
      ["It reproduces randomly every few days. Is this event related?", "Yes, it is a common combination. This event is often recorded together when the cause is hardware that shows up intermittently with temperature or vibration, such as the PSU or a power connector."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6005", "eventlog-6006", "eventlog-6008", "volmgr-161"]
  },

  "windowsupdateclient-25": {
    ko: "event-windowsupdateclient-25.html",
    source: "WindowsUpdateClient", id: "25", area: "Windows Update",
    title: "WindowsUpdateClient Event 25: Update Check Failed",
    desc: "WindowsUpdateClient 25 is known as the record that Windows Update failed to check for updates. An error code is logged with the event, so write the error code down first.",
    lead: "25 is known as the record that Windows Update failed at the stage of checking for updates. It comes before download failure (31) and install failure (20), so look at the network and the state of the update service first.",
    body: [
      "No description of this event could be found in Microsoft's official documentation, so this page is based on reference material that compiles event message wording (lists of Windows event-log providers and event-ID reference sites). Give priority to the message text and the error code of the event on your own PC."
    ],
    conditions: ["Checking for updates in Settings → Windows Update fails", "The update check takes very long or hangs", "It repeats together with 31 (download failure) and 20 (install failure)"],
    causes: ["A network outage, or blocking by a proxy, VPN or firewall", "The Windows Update service is stopped or not responding", "A temporary failure of the update server", "A wrong system date or time"],
    checks: [
      "Write down the error code of the event. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the internet connection and whether a VPN or proxy is in use. Compare with the first check to narrow the cause candidates.",
      "Check the state of the Windows Update service (services.msc) and the system date and time. If it still reproduces at this step, move on to the next item.",
      "Run the Windows Update troubleshooter in Settings. See whether the symptoms differ before and after the change.",
      "If the error code continues, look up the same code in the update error guide. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "Before deleting the SoftwareDistribution folder, stop the services and back up important files.",
      "A record that appears only once may be a temporary network problem."
    ],
    faqs: [
      ["How are 25 and 31 different?", "25 is known as the record that it was blocked at the stage of checking for updates, and 31 at the stage of downloading. The direction of the check differs depending on which stage was blocked."],
      ["Where do I see the error code?", "Write down the error code at the end of the event description (for example a value starting with 0x8024) and look up the same code in the update error guide."]
    ],
    refs: [],
    related: ["windowsupdateclient-31", "windowsupdateclient-20"]
  },

  "winmgmt-10": {
    ko: "event-winmgmt-10.html",
    source: "WinMgmt", id: "10", area: "Applications & services",
    title: "WinMgmt (WMI) Event 10: Event Filter Could Not Be Reactivated",
    desc: "WinMgmt (WMI) event 10 records that a permanent event subscription could not deliver events through its bound filter. It is mostly leftover WMI registration, not a sign of system failure.",
    lead: "WinMgmt (WMI) event 10 records that a permanent event subscription could not deliver events through the filter it is bound to.",
    body: [
      "It comes with a description of the form “Event filter with query ... could not be reactivated” and an error code such as 0x80041003. The cause is usually a WMI filter or subscription left behind by a program that was installed and later removed, or by an OEM utility; this event alone does not mean damage to the hardware or the operating system."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If events pile up with no other symptoms, it is most likely leftover registration that needs no urgent action.",
        "If it began right after a monitoring or security program was installed, first suspect that program's WMI registration failing.",
        "If there are boot delays or service errors as well, check whether the WMI repository itself is damaged."
      ]]
    ],
    conditions: ["Repeats without other symptoms", "Started after a monitoring or security program was installed"],
    causes: ["WMI filters and subscriptions left behind by a program that was removed", "A failed WMI registration by an OEM utility or monitoring program", "Damage to the WMI repository (when other symptoms are present)"],
    checks: [
      "In the event details, write down the name of the filter that caused the problem, the namespace and the error code.",
      "In an administrator PowerShell, list the registered filters with Get-CimInstance -Namespace root/subscription -ClassName __EventFilter and find the entry whose name matches.",
      "Compare whether a program with the same name is installed now, and whether the timing overlaps a program you recently removed.",
      "If it is a filter left by a removed program, confirm it with Get-CimInstance and then carefully delete the related __EventFilter, __FilterToConsumerBinding and __EventConsumer instances.",
      "If nothing else is wrong, you can simply watch it without resetting the repository."
    ],
    caution: [
      "Do not run net stop winmgmt and rename the repository folder to reset it just to reduce the number of events. WMI registrations that other, normal programs use disappear too and may need to be registered again. It is safer to identify which filter is the problem first and clean up only that entry.",
      "If WMI event 10 comes with a service that fails to start, remote-management tool errors, or malfunctions in an antivirus or monitoring program, reinstall that program or contact the manufacturer's support."
    ],
    faqs: [
      ["Is the PC broken if WMI event 10 repeats?", "No. In most cases it comes from WMI event subscriptions and filters left by old or wrongly installed software, and it often causes no real problem for system functions. If events pile up with no other symptoms, no urgent action is needed."],
      ["How do I find out which software is the cause?", "Write down the filter name and the namespace shown in the event description, then list the registered filters with the PowerShell command Get-CimInstance -Namespace root/subscription -ClassName __EventFilter to get clues about which program registered it."],
      ["Does resetting the WMI repository fix it right away?", "Resetting the repository also resets the WMI registrations used by related monitoring and security programs. If other programs depend on WMI, they may need to be registered again after the reset, so do not rush to do it only to reduce the number of events."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/answers/questions/2595560/event-10-wmi-and-error-0x80041003-events-cannot-be", "Microsoft Q&A: Event 10, WMI and Error 0x80041003"],
      ["https://learn.microsoft.com/en-us/troubleshoot/windows-client/system-management-components/event-id-10-logged-application-log-after-install", `${MS}: Event ID 10 is logged`],
      ["https://learn.microsoft.com/powershell/module/microsoft.powershell.diagnostics/get-winevent", `${MS}: Get-WinEvent`]
    ],
    related: ["winsrvext-100", "distributedcom-10016", "application-error-1000", "application-hang-1002"]
  },

  "service-7024": {
    ko: "event-service-7024.html",
    source: "Service Control Manager", id: "7024", area: "Applications & services",
    title: "Service Control Manager 7024: Service Terminated With a Service-Specific Error",
    desc: "Service Control Manager 7024 records that a service terminated with a service-specific error code. Where 7023 shows a Windows error code, 7024 shows a code the service defined itself.",
    lead: "7024 records that a service terminated with an error code that the service itself defined. The program that made the service decides what the code means, so check the service name first and interpret the code by that vendor's standard.",
    body: [
      "You can check the last exit code with the SERVICE_EXIT_CODE item of the sc query <service name> command. If the same service keeps terminating, line it up by time with the 7031 and 7034 records."
    ],
    conditions: ["A program's background function stops suddenly", "Unexpected-termination records such as 7031 and 7034 appear with it", "Right after a program update or a settings change"],
    causes: ["An error situation defined inside the service program (missing configuration, licensing, a failed connection and so on)", "Damage to the related program files or configuration", "A problem with a dependent service, the network or the storage"],
    checks: [
      "Write down the service name in the event and the service-specific error code. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the last exit code with SERVICE_EXIT_CODE of sc query <service name>. Compare with the first check to narrow the cause candidates.",
      "Search the vendor's documentation for that error code. If it still reproduces at this step, move on to the next item.",
      "Compare with Application-log errors at the same time. See whether the symptoms differ before and after the change.",
      "Check whether it repeats after updating or repairing the program. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "A service-specific error code means something different for each program, so do not apply the explanation of another service as it is.",
      "If it is a service of a Windows component, check other events at the same time before touching system files."
    ],
    faqs: [
      ["What is the difference between 7023 and 7024?", "7023 is a record of terminating with a Windows error code, and 7024 is a record of terminating with an error code the service defined itself. The standard for interpreting the error number differs."],
      ["I cannot find anything when I search for the error code.", "Service-specific codes often have no public documentation. Write down the service name and the code and ask the program's manufacturer, or undo recent changes (updates, settings) and compare whether it repeats."]
    ],
    refs: [],
    related: ["service-7000", "service-7001", "service-7009", "service-7011", "service-7023"]
  },

  "service-7026": {
    ko: "event-service-7026.html",
    source: "Service Control Manager", id: "7026", area: "Applications & services",
    title: "Service Control Manager Event 7026: Boot-Start Driver Failed to Load",
    desc: "Service Control Manager 7026 records that some drivers that should start at boot did not load. The body lists the names of the drivers that did not load.",
    lead: "Service Control Manager 7026 records that some boot-start or system-start drivers did not load, and the body lists the driver names. If only one is listed, such as “dam”, only that driver did not load.",
    body: [
      "What matters is which driver is listed. If a single built-in Windows component is listed every time and there are no symptoms, no action is often needed; but if a graphics, storage or network driver is listed, check how that device works and reinstall the driver."
    ],
    conditions: ["At boot", "The driver file is missing or the hardware does not exist"],
    causes: ["A driver that is not needed was deliberately not loaded", "A damaged or deleted driver file, or an incompatible driver", "The device is not present in this PC"],
    checks: [
      "Check the driver names listed in the body (for example dam). Start with what is easy to undo so you can narrow the range without risk.",
      "If the driver name is unfamiliar, find out which device or program it belongs to. Compare with the first check to narrow the cause candidates.",
      "Check in Device Manager whether the same device shows an error mark. If it still reproduces at this step, move on to the next item.",
      "Check whether the driver not loading causes a real symptom (the device not working). See whether the symptoms differ before and after the change."
    ],
    caution: ["If the listed driver is a built-in Windows component and there are no symptoms, it is usually harmless. If a hardware driver (graphics, storage, network) is listed, a reinstall may be needed."],
    faqs: [
      ["7026 appears at every boot. Is it a problem?", "It depends on the listed driver and the symptoms. If a single built-in Windows driver is listed every time and there is no device problem, it is usually harmless."],
      ["For which drivers should I take action?", "If a driver that actually runs a device, such as graphics, storage, network or USB, is listed, check for an error mark in Device Manager and reinstall it with the manufacturer's latest driver."]
    ],
    refs: [],
    related: ["service-7000", "service-7009", "distributedcom-10016", "application-hang-1002"]
  }
};
