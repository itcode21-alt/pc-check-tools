// English editions, batch 6 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims).

const MS = "Microsoft Learn";

export const eventEn6 = {
  "kernel-pnp-219": {
    ko: "event-kernel-pnp-219.html",
    source: "Kernel-PnP", id: "219", area: "Hardware errors",
    title: "Kernel-PnP Event 219: Driver Load Delay",
    desc: "Kernel-PnP 219 records that a device driver was not loaded, or was delayed, during startup. If Device Manager shows the device as normal, there is often no real functional problem.",
    lead: "219 records that a device driver was not loaded, or was delayed, during startup. If Device Manager shows the device working normally, there is often no real functional problem.",
    body: [
      "If it disappears after one restart and does not come back, there is no need to worry much. If it repeats on the same device, replace the driver with the latest version from the manufacturer.",
      "The record includes the device instance path, so the first step is to identify which device it is. A path in the form USB\\VID_xxxx&PID_xxxx is a USB device; searching the VID (vendor) and PID (product) values identifies it in most cases. If it is a leftover entry of a device you already unplugged, no action is often needed."
    ],
    conditions: ["Right after boot", "After connecting a USB or Bluetooth device"],
    causes: ["A missing or conflicting device driver", "An effect of Fast Startup", "Leftover services of a device that was removed"],
    checks: [
      "Identify the device from the instance path in the description. A USB\\VID_xxxx&PID_xxxx path is a USB device, and searching the VID and PID values tells you the vendor and product.",
      "Check the device's state in Device Manager and look for a yellow exclamation mark. Turn on View → Show hidden devices to see devices that are not connected now.",
      "Decide whether it is a device you already removed. If it is a leftover entry of a device you used before, it is not a real problem; removing the entry from the hidden devices list also removes the record.",
      "If it happens only right after boot, turn off Fast Startup (Control Panel → Power Options → Choose what the power buttons do) and check again. Fast Startup skips a full initialization and can cause device recognition problems."
    ],
    caution: ["If the device works normally, a one-off record can simply be observed."],
    faqs: [
      ["Does this event mean the device is broken?", "No. It only records that driver loading was delayed or failed temporarily. If Device Manager shows the device as normal, there is often no functional problem."],
      ["Does turning off Fast Startup help?", "For some USB and Bluetooth devices, Fast Startup can tangle driver initialization, so you can turn it off and compare whether the event still occurs."]
    ],
    refs: [],
    related: ["driverframeworks-10110", "driverframeworks-10111", "kernel-pnp-411"]
  },

  "kernel-power-172": {
    ko: "event-kernel-power-172.html",
    source: "Kernel-Power", id: "172", area: "Power & shutdown",
    title: "Kernel-Power Event 172: Connectivity State in Standby",
    desc: "Kernel-Power 172 is an informational record of whether network connectivity is kept in standby and why. “NIC compliance” means the adapter did not meet the conditions for staying connected.",
    lead: "Kernel-Power 172 is an informational record of whether the network connection is kept or dropped in standby, and the reason. For example, “Disconnected, Reason: NIC compliance” means a policy dropped the connection because the network adapter did not meet the requirements for staying connected in standby.",
    body: [
      "The record is written every time the PC goes to sleep, so a high count is natural. Check the adapter driver and power management settings only when the internet really does not come back right after waking from sleep."
    ],
    conditions: ["When entering sleep or standby", "PCs that support Modern Standby"],
    causes: ["A normal standby connectivity policy (Disconnected/Connected)", "The network adapter or driver does not support the conditions for staying connected in standby"],
    checks: [
      "Check only when the network comes back disconnected after resuming from sleep. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the network adapter's power management option and the driver version. Compare with the first check to narrow the cause candidates."
    ],
    caution: ["Disconnected by itself is not an error. If there is no symptom, no action is needed."],
    faqs: [
      ["172 keeps appearing — is that a problem?", "Not if there is no symptom. It is written as many times as the PC enters sleep."],
      ["What if the network is down after sleep?", "In Device Manager, turn off the network adapter's power management option (Allow the computer to turn off this device to save power), update the adapter driver to the latest manufacturer version, and check whether it still reproduces."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6005"]
  },

  "hal-15": {
    ko: "event-hal-15.html",
    source: "HAL", id: "15", area: "Hardware errors",
    title: "HAL Event 15: IOMMU Error",
    desc: "HAL 15 is a hardware-level record that the CPU's IOMMU detected an error in a device's memory access. It can appear with AMD-Vi or Intel VT-d systems in connection with virtualization and PCIe devices.",
    lead: "This record, whose source is HAL (Hardware Abstraction Layer), shows the sentence “The IOMMU has encountered an error” together with Device (device ID), FaultInformation (address of the fault) and FaultReason (fault reason code).",
    body: [
      "The IOMMU is a hardware layer that watches that PCIe devices stay within the allowed range when they access system memory directly (DMA); when it detects a problem during that watching, the error is recorded.",
      "The event by itself does not mean a part has failed. If it was recorded a few times in a cluster over a few weeks and then never recurred, it was most likely a temporary issue with a particular driver version or the initialization timing."
    ],
    conditions: ["While using virtualization (Hyper-V, WSL2 and so on) or GPU passthrough", "After the connection state of a particular PCIe device (GPU, NVMe, USB controller and so on) changed", "A pattern that repeats in a short period and then stops"],
    causes: ["The motherboard BIOS/UEFI IOMMU (AMD-Vi, VT-d) settings are not up to date", "A particular PCIe device's driver or firmware makes wrong DMA requests", "Virtualization software (Hyper-V, VMware and so on) conflicts with the hardware IOMMU mapping", "Poor physical contact in memory or a PCIe slot"],
    checks: [
      "Check the motherboard maker's website for the latest BIOS update. Start with what is easy to undo so you can narrow the range without risk.",
      "Write down the Device and FaultInformation values in the event and check whether the same values repeat. Compare with the first check to narrow the cause candidates.",
      "If you recently added or replaced a PCIe device, reseat it in its slot. If it still reproduces at this step, move on to the next item.",
      "Temporarily turn off virtualization features such as Hyper-V and WSL2 and compare whether it still reproduces. Compare the symptoms before and after the change.",
      "If it repeats after a restart, move the device to another slot or remove it to identify the cause device. If it still repeats, consider the next cause."
    ],
    caution: ["Do not conclude from this one event that the motherboard or CPU has failed. If it does not recur, it was most likely a temporary driver or initialization issue. If power is lost during a BIOS update, the motherboard can be damaged, so keep a laptop plugged in to its charger."],
    faqs: [
      ["Does an IOMMU error mean the motherboard or CPU is broken?", "It cannot be concluded. If it was recorded a few times in a cluster and then never recurred, it was most likely a temporary driver or initialization issue. Judge it together with how often it repeats."],
      ["Can this error appear even if I do not use virtualization (Hyper-V, WSL2)?", "Yes. The IOMMU is not a virtualization-only feature but a hardware layer that controls PCIe devices' DMA access, so it can be recorded because of a driver or firmware problem of a particular PCIe device even without virtualization."]
    ],
    refs: [],
    related: ["whea-logger-17", "whea-logger-18", "whea-logger-19", "whea-logger-20", "whea-logger-46"]
  },

  "tpm-15": {
    ko: "event-tpm-15.html",
    source: "TPM", id: "15", area: "Security & accounts",
    title: "TPM Event 15: Hardware Error",
    desc: "TPM 15 records that the TPM (security chip) driver detected an unrecoverable error in the TPM hardware, so TPM-based features such as BitLocker and Windows Hello may stop working.",
    lead: "TPM 15 records that the TPM (security chip) driver detected an unrecoverable error in the hardware. TPM-based features such as BitLocker and Windows Hello may not work properly. The cause is more likely BIOS firmware or the TPM module itself than a software setting.",
    body: [
      "If the TPM is built into the motherboard (fTPM/PTT), it is often fixed by a BIOS firmware update. If it is a separate module plugged into a header, check the contact first.",
      "The TPM is the security chip used by BitLocker keys, Windows Hello and some other security features. When this record appears, those features may not work."
    ],
    conditions: ["During boot or sign-in", "While trying to use BitLocker or Windows Hello"],
    causes: ["The motherboard BIOS/UEFI firmware is old and has a compatibility problem with the TPM module", "A defect or failed initialization of the TPM firmware itself", "Poor contact of the motherboard's TPM module (built in, or a separate header-mounted one)"],
    checks: [
      "Secure the BitLocker recovery key first. Before touching the TPM, get the recovery key: for a personal PC from the device page of your Microsoft account, for a work PC from your administrator. If you clear the TPM without the key, you may not be able to open the drive.",
      "Check the status in tpm.msc. Type tpm.msc in the Run box to open the TPM Management console and check the status and the manufacturer version. If it says “Compatible TPM cannot be found”, the problem is in the hardware or BIOS settings.",
      "Update the BIOS firmware. Download the latest BIOS/UEFI from the motherboard or laptop maker and apply it. TPM-related fixes are often included, so some cases are resolved at this step.",
      "Check how the module is seated. If the motherboard uses a separate TPM module on a header, turn the power off and check that the module is fully inserted and facing the right way."
    ],
    caution: ["Before clearing (resetting) the TPM, always back up the recovery key of any BitLocker-encrypted drive. If you have BitLocker on, secure the recovery key first and, if possible, suspend BitLocker before you proceed."],
    faqs: [
      ["Does TPM 15 mean I cannot use Windows 11?", "The PC will not stop booting right away, but features that depend on the TPM, such as BitLocker and Windows Hello, may be limited. It is often fixed by a BIOS update, so try that first."],
      ["Does resetting the TPM erase my data?", "Clearing the TPM does not itself erase drive data, but if the drive is encrypted with BitLocker and you do not have the recovery key, access can be blocked, so back up the recovery key first."]
    ],
    refs: [],
    related: ["tpm-30", "tpm-wmi-1040", "tpm-wmi-1801", "security-1102", "security-4625"]
  },

  "tpm-wmi-1040": {
    ko: "event-tpm-wmi-1040.html",
    source: "TPM-WMI", id: "1040", area: "Security & accounts",
    title: "TPM-WMI Event 1040: Device Attestation Pre-check Failed",
    desc: "TPM-WMI 1040 records that a key component failed the device attestation pre-check, so the device is expected not to pass attestation. If it appears with TPM-WMI 1801, it may be an extension of that.",
    lead: "The wording looks serious, but this event is not an actual failure: it is the result of Windows diagnosing itself ahead of time by measuring the boot process (Measured Boot). Read together with the original log (TPM-WMI 1801 and so on), it is in most cases a sign that the Secure Boot certificates have not yet been updated, so the measured values differ from what was expected.",
    body: [
      "If real features such as BitLocker and Windows Hello are working normally, there is no urgent action. The first step is to check whether a real function is actually failing."
    ],
    conditions: ["Recorded around the same time as TPM-WMI 1801", "While using features that need device attestation, such as BitLocker and Windows Hello", "A result JSON file is created in the MeasuredBoot log folder"],
    causes: ["The Secure Boot certificates are not up to date, so the boot measurements differ from what was expected", "The BIOS/UEFI firmware is old and the Measured Boot chain does not match the expected values", "A defect or initialization state problem in the TPM firmware itself"],
    checks: [
      "Open the JSON file in the MeasuredBoot log folder named in the event and see which component failed. Start with what is easy to undo so you can narrow the range without risk.",
      "Check whether TPM-WMI 1801 (Secure Boot certificates not applied) appears around the same time. Compare with the first check to narrow the cause candidates.",
      "Update to the latest BIOS from the motherboard or laptop maker and check whether it still reproduces. If it repeats at this step, move on to the next item.",
      "Check whether there is a real failure in features such as BitLocker and Windows Hello. If they work normally, there is no urgent action."
    ],
    caution: ["The wording looks serious, but if BitLocker and Windows Hello have no real failure, do not reset or reinstall right away. Before resetting the TPM, always back up the BitLocker recovery key."],
    faqs: [
      ["Does this event mean I can no longer use BitLocker or Windows Hello?", "Not immediately. BitLocker and Windows Hello that are already set up often keep working. Some enterprise and cloud sign-in scenarios that require attestation may be restricted, so first check whether a real function is failing."],
      ["How do I open the JSON file in the MeasuredBoot log?", "Open the C:\\Windows\\Logs\\MeasuredBoot folder in File Explorer and open the file named in the event with Notepad or another text editor; you can read in text which component check failed."]
    ],
    refs: [],
    related: ["tpm-wmi-1801", "tpm-15", "security-1102", "security-4625", "security-4740"]
  },

  "schannel-36887": {
    ko: "event-schannel-36887.html",
    source: "Schannel", id: "36887", area: "Network",
    title: "Schannel Event 36887: TLS Fatal Alert Received",
    desc: "Schannel 36887 records that the remote endpoint (the server) refused the TLS handshake with this PC and sent a fatal alert. It is the opposite direction of 36888, the alert this PC sent.",
    lead: "Schannel is the Windows TLS/SSL component. 36887 means this PC received a “fatal alert” from the other server and the handshake was stopped. You need the actual alert code in the event description and the calling process to narrow down the cause.",
    body: [
      "It is a record of a rejection on the server side, but the real cause is often this PC's TLS settings or security software. If it repeats at the same time as 36874 (protocol or cipher mismatch), treat it as an extension of the failed negotiation."
    ],
    conditions: ["Connecting to a particular site or server fails", "While using a VPN, a proxy or antivirus HTTPS inspection", "Repeats at the same time as 36874"],
    causes: ["The server does not support this PC's TLS version or cipher suites", "The certificate has expired or cannot be trusted", "HTTPS inspection of antivirus or VPN intercepts the handshake and the server rejects it", "A wrong system date or time makes certificate validity checks fail"],
    checks: [
      "Check the fatal alert code and the calling process (PID) in the event description. Start with what is easy to undo so you can narrow the range without risk.",
      "Check in Settings > Time & language that setting the date and time automatically is on. Compare with the first check to narrow the cause candidates.",
      "Temporarily turn off the HTTPS inspection of your antivirus or VPN and compare whether it still reproduces. If it repeats at this step, move on to the next item.",
      "Update the browser and Windows to the latest versions to check the supported TLS range. Compare the symptoms before and after the change.",
      "Tell apart whether it repeats only with one particular server or occurs randomly with many. If it is only one server, the cause is more likely that server's settings."
    ],
    caution: ["While antivirus HTTPS inspection is off, its ability to detect phishing and spoofed sites also drops, so turn it back on as soon as you finish checking. Do not enable TLS 1.0 and 1.1 unconditionally just to lower security."],
    faqs: [
      ["Does 36887 mean I have been hacked?", "No. Most cases are records that can occur even in a normal network environment, such as an expired certificate, an old TLS version or a conflict with the HTTPS inspection of security software."],
      ["Why do I see %1 and %3 left as they are in the event description?", "It happens when you open a log file saved from another PC rather than the PC that recorded the event. The exact values have to be checked on the original PC."]
    ],
    refs: [],
    related: ["schannel-36888", "dns-1014", "tcpip-4199", "e2fexpress-27", "e2fexpress-32"]
  },

  "print-spooler-372": {
    ko: "event-print-spooler-372.html",
    source: "PrintService", id: "372", area: "Applications & services",
    title: "PrintService Event 372: Document Failed to Print",
    desc: "PrintService 372 records that a print job failed on the printer. The Win32 error code shown with it changes the cause a lot: 1722 is an RPC server problem, 87 a parameter error, 259 no more data.",
    lead: "PrintService event 372 records that a print job failed on the printer. It appears with a “The document failed to print” description and a Win32 error code, and the cause differs greatly depending on the code.",
    body: [
      "1722 means the RPC server is unavailable (a network or connection problem), 87 is a parameter error, and 259 is no more data (a problem with the print data itself)."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If a network printer shows error code 1722, first look at the connection to the printer or print server and the state of the services.",
        "If it repeats only with a particular document, suspect a problem in the print data itself together with error code 87 or 259.",
        "If it happens widely across many documents and printers, damage to the spooler service or the driver is more likely."
      ]]
    ],
    conditions: ["A print job fails right after starting", "Connecting to a network printer or print server", "Repeats only with a particular document or driver"],
    causes: ["Damage to the Print Spooler service or the spool files", "A failure of the RPC or shared connection of a network printer (error 1722)", "Damage to the printer driver or a compatibility problem", "Wrong print data makes the spooler fail to process it (error 87 or 259)"],
    checks: [
      "Check the Win32 error code in the event and compare its meaning.",
      "Restart the Print Spooler service in services.msc.",
      "If it still fails, stop the spooler, clear the leftover job files in the C:\\Windows\\System32\\spool\\PRINTERS folder, and start the service again.",
      "Update or reinstall the printer driver with the latest manufacturer version.",
      "For a network printer, turn off the bidirectional support option and check whether it still reproduces."
    ],
    caution: [
      "Do not reinstall the printer or delete the driver without checking the error code. Whether it is a network problem, a problem with the document itself or spooler damage differs by code, so check the code first and choose the action that fits.",
      "If 372 repeats on many printers and many PCs at the same time, it may be a failure of the print server itself, so check the server's state first."
    ],
    faqs: [
      ["What does error code 1722 mean?", "It means the RPC server is unavailable. It appears when the connection to a network printer or print server is broken, or the print spooler service on that device is not responding. First check the network connection, the power of the printer and server, and the state of the print service."],
      ["What if it keeps failing even after restarting the spooler?", "A damaged job file left in the spool folder may be the cause. Stop the spooler service, clear the files in the spool\\PRINTERS folder, and start the service again. If it still repeats, reinstall the printer driver with the latest version."],
      ["What should I check if it repeats only with one document?", "If error code 87 (parameter error) or 259 (no more data) is shown with it, the print data of that document may be the problem. Save it in another format or print it on another printer to tell whether the document itself is the problem."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/dd393167(v=ws.10)", `${MS}: Event ID 372 — Print Spooler Status`],
      ["https://learn.microsoft.com/en-us/answers/questions/4296975/print-spooler-error-808", "Microsoft Q&A: Print Spooler error 808"]
    ],
    related: ["service-7034", "service-7031", "application-error-1000"]
  },

  "time-service-134": {
    ko: "event-time-service-134.html",
    source: "Time-Service", id: "134", area: "Network",
    title: "Time-Service Event 134: DNS Resolution Error for the Time Server",
    desc: "Time-Service (W32Time) 134 records that the configured time server name could not be resolved through DNS, so time synchronization failed. It is usually a DNS or network timing issue, not a faulty clock.",
    lead: "Time-Service (W32Time) event 134 records that time synchronization failed because the configured time server name could not be resolved through DNS. It does not mean the system clock hardware is broken.",
    body: [
      "It is recorded with a description such as “DNS resolution error on 'time.windows.com'”, and most often occurs right after boot or right after resuming from sleep, when the network is not ready yet."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If it was recorded once right after boot or resuming from sleep, it is a network-readiness timing issue and is usually retried automatically.",
        "If it repeats and the real clock is off, check the DNS, firewall and VPN settings.",
        "On a work or school domain PC, first check whether it can reach the domain controller's time server."
      ]]
    ],
    conditions: ["Right after boot or resuming from sleep", "The clock is actually drifting and repeats", "On a work or school domain, VPN or corporate network"],
    causes: ["DNS resolution failure for time.windows.com or another time server", "The network adapter was not ready right after resuming from sleep", "A firewall, VPN or corporate network policy blocks NTP (UDP 123)"],
    checks: [
      "Write down the time server name and the DNS error code shown in the event description.",
      "Try a manual sync with w32tm /resync in a Command Prompt with administrator rights.",
      "Check the current sync source and last successful time with w32tm /query /status.",
      "On an ordinary home network, check the DNS server settings and the internet connection.",
      "On a corporate network or VPN, ask the administrator whether outbound NTP (UDP 123) traffic is allowed."
    ],
    caution: [
      "Do not reinstall the time service or edit the registry directly just because the event was recorded once or twice. Most cases are temporary network timing issues, so first check whether it repeats and how far the clock is actually off.",
      "If the time is off by several minutes or more and sign-in, certificate or Windows Update errors occur together, run w32tm /resync manually, and if it repeats, check with the network administrator or your ISP."
    ],
    faqs: [
      ["Should I act right away if event 134 appears once?", "If it is one-off, it is usually a timing issue where the network was not ready right after boot or resuming from sleep, and it resolves by itself after an automatic retry. If it is recorded repeatedly and the real clock drifts, then check the DNS and network settings."],
      ["Is it a problem if the time is off by only a few minutes?", "As the difference grows, errors can occur in HTTPS certificate validation, Kerberos authentication, cloud sign-in and Windows Update signature checks. A difference of a few seconds is usually fine, but if it is off by several minutes or more, check the synchronization."],
      ["How is it different on a work or school PC?", "A domain-joined PC normally uses the domain controller as its time server, and corporate network policy or the firewall often blocks access to outside NTP servers. In that case, ask the administrator before changing personal settings."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/answers/questions/3783558/event-id-134-time-service-error", "Microsoft Q&A: Event ID 134 Time Service Error"],
      ["https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/w32time-event-142-time-service-stopped-advertising", `${MS}: W32Time event 142`]
    ],
    related: ["dns-1014", "kernel-power-172"]
  },

  "powershell-4104": {
    ko: "event-powershell-4104.html",
    source: "Microsoft-Windows-PowerShell", id: "4104", area: "Security & accounts",
    title: "PowerShell Event 4104: Script Block Logging",
    desc: "PowerShell 4104 means script block logging recorded the full content of a script block that PowerShell compiled and ran. Most are normal automation, but encoded code should always be checked.",
    lead: "PowerShell event 4104 is the script block logging feature recording the full content of a script block that PowerShell compiled and ran, in the Microsoft-Windows-PowerShell/Operational log.",
    body: [
      "The feature is designed to record even the normal automation scripts of administrators, backups and installers as they are, so the existence of the event does not by itself mean malicious activity. However, scripts hidden by Base64 encoding or string concatenation, or containing phrases such as Invoke-Expression, DownloadString and FromBase64String, are signs that need a security review."
    ],
    sections: [
      ["Tell the situations apart first", [
        "If security software raised a PowerShell-related warning, first find the 4104 event at the time shown in the warning.",
        "If there is an unknown scheduled task or startup program, compare the PowerShell command it runs against the 4104 log.",
        "After ordinary administration or installation work, it is mostly normal automation and urgency is low."
      ]]
    ],
    conditions: ["Security software raised a PowerShell-related warning", "A PowerShell command run by an unknown scheduled task or startup program", "Phrases such as Invoke-Expression, DownloadString and FromBase64String"],
    causes: ["Normal automation such as administration, backup and update scripts", "An installer or driver utility runs PowerShell internally", "Malware or a remote intrusion tool uses PowerShell to avoid detection"],
    checks: [
      "Check the ScriptBlockId in the event description, and if several events share the same ID, collect them in order to rebuild the whole script.",
      "If there are parts obfuscated by Base64 encoding or string concatenation, decode them to see which commands they actually run.",
      "Check the account that ran it and the parent process (scheduled task, service, document macro, browser and so on).",
      "Compare with Windows Defender 1116 and 1117 and process creation events (4688) at the same time to check whether it was detected or blocked.",
      "If it is confirmed to be normal automation, move on without action; if an unfamiliar download or encoded command is confirmed, cut the network connection and run a full scan."
    ],
    caution: [
      "Do not turn off script block logging itself just because many 4104 events have piled up. It is often on for security monitoring, and turning it off can lower real threat detection. Conversely, you do not need to suspect everything as malicious just because administration scripts record in large numbers every day.",
      "If the decoded script contains remote download, credential theft or commands that disable defenses, cut the network connection and run an offline scan and change your account passwords first."
    ],
    faqs: [
      ["Does a 4104 event always mean malware?", "No. Script block logging is designed to record every script block PowerShell runs, so normal automation scripts such as backups, updates and installers also leave this event in large numbers. You need to look at the encoding or obfuscation and the actual content together."],
      ["Why is a long script split into several events?", "Because of the size limit of one event, a long script block is recorded split across several 4104 events. Joining the events with the same ScriptBlockId in order rebuilds the original whole script."],
      ["Can I turn script block logging on or off on my PC?", "You can adjust it with the “Turn on PowerShell Script Block Logging” setting under Administrative Templates → Windows Components → Windows PowerShell in the Group Policy editor. It is often enabled for security monitoring, so on an organization's PC talk to the administrator before turning it off."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/powershell/scripting/windows-powershell/wmf/whats-new/script-logging", `${MS}: PowerShell script logging`],
      ["https://learn.microsoft.com/powershell/module/microsoft.powershell.diagnostics/get-winevent", `${MS}: Get-WinEvent`]
    ],
    related: ["defender-1116", "defender-1117"]
  },

  "msiinstaller-1033": {
    ko: "event-msiinstaller-1033.html",
    source: "MsiInstaller", id: "1033", area: "Applications & services",
    title: "MsiInstaller Event 1033: Installation Result Status",
    desc: "MsiInstaller 1033 is the record Windows Installer leaves with a result status after finishing an installation. A status of 0 is success; a value such as 1603 is a failure, read together with 11708.",
    lead: "1033 is the record Windows Installer leaves with a result status after finishing an installation task. It is also written for successful installations, so the deciding factor is not that this event exists but whether the status value is 0.",
    body: [
      "If the status value is not 0, first check 11708 and the product name at the same time. The meaning of a value can be found in the Windows Installer error code list, and a broad code such as 1603 needs a detailed log to find the cause."
    ],
    conditions: ["Written every time a program installation, removal or update finishes", "A status value other than 0 means the installation failed", "11708 is left with it"],
    causes: ["Status 0: completed normally", "Status 1603: a fatal error during installation (the cause is found in the detailed log)", "Other values: Windows Installer error codes (they differ by product and environment)"],
    checks: [
      "Check whether the status value is 0. Start with what is easy to undo so you can narrow the range without risk.",
      "If it is not 0, check 11708 and the product name at the same time. Compare with the first check to narrow the cause candidates.",
      "Look up the status value in the Windows Installer error code list. If it repeats at this step, move on to the next item.",
      "Create a detailed log and check the step that failed. Compare the symptoms before and after the change."
    ],
    caution: ["Most records are successes (0), so do not treat many 1033 records as a problem by themselves. Move on to checking the cause of a failure only when the status value is not 0."],
    faqs: [
      ["I see a lot of 1033 — is something wrong?", "A large number is normal, because it is left every time an installation, removal or update finishes. Look only at the records whose status value is not 0 as failures."],
      ["What does status value 1603 mean?", "It is a general code meaning a fatal error occurred during installation. The value alone does not tell the specific cause, so check the part before the line that says Return value 3 in the detailed log."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/windows/win32/msi/error-codes", `${MS}: Windows Installer Error Codes`]
    ],
    related: ["msiinstaller-11708"]
  },

  "user-profile-service-1530": {
    ko: "event-user-profile-service-1530.html",
    source: "User Profile Service", id: "1530", area: "Applications & services",
    title: "User Profile Service Event 1530: Registry Handles Cleaned Up",
    desc: "User Profile Service 1530 records that Windows cleaned up a user registry hive that an app or service did not close at sign-out. Microsoft documents it as designed behavior.",
    lead: "1530 records that at sign-out an app or service did not close the user registry hive, so Windows cleaned it up for it. It is described as designed behavior, and a one-off is usually not urgent.",
    body: [
      "It matters only when sign-out is really slow or it repeats after closing a particular app. Write down the process name shown in the event, and update that app or compare with a clean boot."
    ],
    conditions: ["Sign-out or shutdown becomes slow", "Repeats after closing a particular app", "Only warnings pile up with no functional failure"],
    causes: ["A background app keeps using the user's settings", "An old program or service does not respond properly to the sign-out event", "A delay in closing of security, sync or backup programs"],
    checks: [
      "Write down the process name shown in the event and the time it occurred. Start with what is easy to undo so you can narrow the range without risk.",
      "Check whether sign-out is really delayed. Compare with the first check to narrow the cause candidates.",
      "Compare whether it reproduces after updating that app, changing its exit settings, and in a clean boot. If it still reproduces at this step, move on to the next item.",
      "If there is no functional failure, do not edit the registry just to reduce the number of events. Compare the symptoms before and after the change."
    ],
    caution: ["Do not conclude a memory leak or a damaged user profile from 1530 alone. A single, one-off warning is usually not urgent."],
    faqs: [
      ["1530 has piled up — is my profile damaged?", "It cannot be concluded that way. It is a record that an app did not close a handle, not profile damage, so unless sign-in problems or sign-ins to a temporary profile occur with it, it is something to observe."],
      ["Can I fix the registry to make it go away?", "It is not recommended. If there is no problem with functions, do not edit the registry just to reduce the number of records."]
    ],
    refs: [],
    related: []
  },

  "service-7040": {
    ko: "event-service-7040.html",
    source: "Service Control Manager", id: "7040", area: "Applications & services",
    title: "Service Control Manager Event 7040: Service Start Type Changed",
    desc: "Service Control Manager 7040 records that a Windows service's start type was changed. Updates, driver installs and management tools can cause it, so check who changed it and whether a function actually failed.",
    lead: "7040 is a configuration-change record saying a service's start type was changed. It is not an error, and updates, driver installs and management tools can also leave it.",
    body: [
      "Check the service name and the old and new start types in the event, and match them against the installation and update records at the time of the change. If a needed function was switched off, restore only that service to its original state; do not switch everything to automatic."
    ],
    conditions: ["After installing or updating a driver or security program", "After a service was changed to automatic, manual or disabled", "A particular function does not work after boot"],
    causes: ["A normal program or driver installation", "A Windows component update", "A clean boot or the user changing service settings", "An unwanted program switching off a security or update service"],
    checks: [
      "Write down the service name and the old and new start types in the event. Start with what is easy to undo so you can narrow the range without risk.",
      "Compare with installation records, Windows Update and security events at the time of the change. Compare with the first check to narrow the cause candidates.",
      "Check whether the service is linked to a function you actually need. If it still reproduces at this step, move on to the next item.",
      "If it is an unexpected change of a security service, check Defender's state and recently installed programs. Compare the symptoms before and after the change."
    ],
    caution: ["7040 is a configuration-change record, not an error. If you set every service back to automatic start, boot delays or conflicts can occur."],
    faqs: [
      ["The start type changed from automatic to manual — is that a problem?", "Windows components or programs often change it normally. Restore it only when that function really does not work."],
      ["What if a security-related service was turned off?", "If it is an unexpected change, check the Windows Security status and recently installed programs and run a scan."]
    ],
    refs: [],
    related: ["service-7000", "service-7001", "service-7023", "service-7045"]
  }
};
