// English edition of the five informational-event group pages (see event-group-content.mjs, the Korean
// source). Rows are keyed by "source id" exactly as in data.js; each row is [meaning, what to check] and an
// optional third element overriding the default caution. Translations stay faithful to the Korean/data.js
// text — no new technical claims.

export const DEFAULT_WARNING = "An informational record; on its own it is not a problem.";

export const groupsEn = {
  "event-info-boot.html": {
    eyebrow: "Boot records",
    short: "Records written at every boot",
    title: "Records Written at Every Boot — Kernel-Boot, Kernel-General, EventLog 6009",
    desc: "What the boot information records Kernel-Boot 18/25/27/30/32/238, Kernel-General 15/16/20/24/25 and EventLog 6009 mean, and the rare cases where they become a clue to a real problem.",
    lead: "Open the System log in Event Viewer and you will find a run of Information-level records right after boot. Most are normal records reporting the boot configuration and timing, and their presence alone does not mean anything is wrong with the PC.",
    intro: [
      "This group covers boot options, the boot times reported by the firmware, system time initialization and registry maintenance. They only mean something once you read the values, so you can normally ignore them.",
      "There are two cases where they become useful: when boot is slow and you want to see whether the firmware phase is long (Kernel-Boot 30), and when the boot time looks off (Kernel-Boot 238, Kernel-General 25)."
    ],
    judge: [
      "If there are no Error or Warning records from the same time, you can ignore this group.",
      "If the time looks off, read the Success value and the RTC error code in Kernel-General 25 and the firmware time in Kernel-Boot 238, then check the BIOS clock and the motherboard battery (CMOS).",
      "If boot is slow, compare the firmware-phase time in Kernel-Boot 30 with other days, and if a BitLocker PIN is the reason, see whether Kernel-Boot 32 is not 0.",
      "Wininit 23, 24 and 25 are records of the Boot App Anti-Rollback feature. Check them only when the HRESULT or Win32Error is not a success (0)."
    ],
    faqs: [
      ["These records appear at every boot. Is my PC broken?", "No. Information-level records report a normal boot process and do not mean an error. Use them as a clue only when there are Error/Warning records from the same time and a real symptom."],
      ["Is Kernel-Boot 153 part of this group?", "No. Kernel-Boot 153 is a record that virtualization-based security is enabled, so it is explained in a separate group (the VBS and security records page). Its source differs from Disk 153 and the graphics driver's 153."]
    ],
    rows: {
      "Kernel-Boot 18": ["Records the number of boot entries (boot options) configured on this system.", "If a multi-boot setup is not what you intended, check the number of boot entries."],
      "Kernel-Boot 25": ["Records the boot menu policy value.", "Use as a reference when investigating boot menu behavior."],
      "Kernel-Boot 27": ["Records the boot type (BootType) and load options (NOEXECUTE, FVEBOOT and so on).", "Use as a reference when investigating boot options."],
      "Kernel-Boot 30": ["Records boot time metrics reported by the firmware (when OS image loading started, when boot services ended and so on).", "If boot is slow, compare the values to see whether the firmware phase is long."],
      "Kernel-Boot 32": ["Records the time the boot manager waited for user input (BitlockerUserInputTime). 0 means it did not wait for input.", "If a BitLocker PIN prompt makes boot slow, check this value."],
      "Kernel-Boot 238": ["Records the time-zone bias and firmware time reported by UEFI firmware.", "If the boot time looks off, check the BIOS clock and the motherboard battery (CMOS)."],
      "Kernel-General 15": ["Records that a registry hive was reorganized and its size reduced.", "Check the hive name and the change in size."],
      "Kernel-General 16": ["Records that the access history of a registry hive was cleared.", "Even a large number of repeats is normal."],
      "Kernel-General 20": ["Records that the leap second setting was updated.", "Use as a reference when investigating time synchronization problems."],
      "Kernel-General 24": ["Records that time-zone information was updated.", "If the time is off, check the time-zone setting."],
      "Kernel-General 25": ["Records the values the system time was initialized to at boot (RTC time, loader time, whether it succeeded).", "If Success is false or the RTC error code is not 0, check the motherboard battery and the BIOS clock."],
      "EventLog 6009": ["An informational event that records the Windows version/build and the processor configuration (for example Multiprocessor Free) at boot.", "Use together with 6005 and 6013 when checking boot time and the Windows build."],
      "Subsys-SMSS 17": ["Records that a platform binary (an executable supplied by the firmware) ran successfully.", "If a program installed by the firmware is suspected, check whether it ran."],
      "Wininit 23": ["Records the result of initializing Boot App Anti-Rollback.", "Check only if the HRESULT is not a success."],
      "Wininit 24": ["Records that the Boot App Anti-Rollback timer started (including start time, grace period and expiry time).", "Check only if Win32Error is not 0."],
      "Wininit 25": ["Records that the previous Boot App Anti-Rollback timer was continued.", "Check only if the HRESULT is not a success."]
    }
  },

  "event-info-security-vbs.html": {
    eyebrow: "Security feature records",
    short: "Virtualization-based security and TPM records",
    title: "Virtualization-Based Security (VBS), Credential Guard and TPM Records Explained",
    desc: "How to tell whether the security feature records from Hyper-V-Hypervisor, IsolatedUserMode, Wininit 12/14/18/19, LsaSrv 6156, TPM-WMI 1025/1282 and Directory-Services-SAM are normal.",
    lead: "A PC with Memory integrity (VBS/HVCI), Windows Hello, a TPM or Credential Guard turned on writes an information record at every boot to say that these security features started. Seeing many of them is evidence that things are working normally.",
    intro: [
      "Seeing Hyper-V-Hypervisor 1 at every boot means the hypervisor started normally, and it appears if you use Memory integrity (VBS) or WSL2/virtual machine features. It can appear because of VBS even if you never use a virtual machine.",
      "Entries whose value is written as 0 (for example LsaSrv 6156 and Wininit 14) mean the conditions for that feature are not met or it is not used; they are not errors. The values worth checking in this group are listed under “When to worry” below."
    ],
    judge: [
      "If the Problems value in Hyper-V-Hypervisor 129 is not 0x0, check the IOMMU and virtualization settings in the BIOS.",
      "Check the trustlet (for example NgcIso.exe, related to Windows Hello) only when the status in IsolatedUserMode 1 and 5 is not STATUS_SUCCESS.",
      "If flags in IsolatedUserMode 3 contain HvciEnabled, Memory integrity is on. If you turned Memory integrity off because of an incompatible driver, these flags change.",
      "Check Wininit 19, 23 and 25 only when the HRESULT is not a success (0), and Wininit 24 only when Win32Error is not 0.",
      "Check the state in tpm.msc only when there are separate TPM errors (Warning or Error level). Do not reset the TPM before you have secured your BitLocker recovery key.",
      "The Directory-Services-SAM records are Windows' default security hardening and auditing behavior. You do not need to look at them unless you are reviewing password policy."
    ],
    faqs: [
      ["I do not use Hyper-V, but Hyper-V-Hypervisor records appear.", "If a feature that uses the hypervisor, such as Memory integrity (VBS), WSL2 or Sandbox, is on, the record is left at every boot even if you never use a virtual machine directly. If you want to turn it off, check Windows Features and the Memory integrity setting."],
      ["LsaSrv 6156 or Wininit 14 shows 0. Is that OK?", "Yes. A value of 0 means the conditions for automatically enabling Credential Guard (the hardware requirements for virtualization-based security, domain membership, licensing) are not met or it is not used. Check the values only if you intend to use Credential Guard."],
      ["Kernel-Boot 153 appears. Is it a disk error?", "No. A 153 whose source is Kernel-Boot is a boot security record saying that virtualization-based security is enabled. It has nothing to do with Disk 153 (I/O retries) or nvlddmkm 153 (graphics)."]
    ],
    rows: {
      "Hyper-V-Hypervisor 1": ["Records that the hypervisor (the Hyper-V layer) started normally. It is left at every boot if you use Memory integrity (VBS) or WSL2/virtual machine features.", "If you want to turn virtualization features off, check Windows Features and the Memory integrity setting."],
      "Hyper-V-Hypervisor 2": ["Records the hypervisor scheduler type (SchedulerType).", "Use as a reference when investigating virtual machine performance problems."],
      "Hyper-V-Hypervisor 129": ["Records the result of the hypervisor initializing I/O remapping (IOMMU): whether the hardware is present and used, and the Problems value. A Problems value of 0x0 means no problem.", "If Problems is not 0, check the IOMMU and virtualization settings in the BIOS."],
      "Hyper-V-Hypervisor 156": ["Records that the hypervisor applied the mitigation settings for a CPU vulnerability affecting virtual machines (CVE-2018-3646).", "If you worry about performance loss, check it together with whether virtualization-based security features are used."],
      "Hyper-V-Hypervisor 165": ["Records that the hypervisor applied the mitigation settings for CPU vulnerabilities affecting virtual machines (the MDS family of CVEs).", "If you worry about performance loss, check it together with whether virtualization-based security features are used."],
      "IsolatedUserMode 1": ["Records that a Secure Trustlet (for example NgcIso.exe, related to Windows Hello) started in the isolated security area. A status of STATUS_SUCCESS means success.", "Check the trustlet and the status only if it is not STATUS_SUCCESS."],
      "IsolatedUserMode 2": ["Records that a Secure Trustlet ended.", "Even many repeats are normal; it is left at every sign-in and shutdown."],
      "IsolatedUserMode 3": ["Records that the Secure Kernel (virtualization-based security) started. If flags contains HvciEnabled, Memory integrity (HVCI) is on.", "Use the change in these flags as a reference when you turn off Memory integrity because of an incompatible driver."],
      "IsolatedUserMode 5": ["Records that a Secure Trustlet started (including the default entry whose image name is NULL).", "Check only if it is not STATUS_SUCCESS."],
      "Kernel-Boot 153": ["Records that virtualization-based security (VBS) is enabled and the reason (such as a registry configuration).", "It has nothing to do with Disk 153 or nvlddmkm 153 — check that the source is Kernel-Boot.", "A 153 whose source is Kernel-Boot is a boot security record, not a disk or graphics error."],
      "Wininit 12": ["Records that LSASS.exe started as a protected process.", "Use as a reference when a security program conflict is suspected."],
      "Wininit 14": ["Records the Credential Guard configuration values (registry setting, test configuration, automatic enablement). A value of 0 means the feature is not used.", "If you intend to use Credential Guard, check the values."],
      "Wininit 18": ["Records that VBS key isolation started and began protecting keys isolated in VSM.", "It does not appear in an environment where virtualization-based security is off."],
      "Wininit 19": ["Records the result (HRESULT) of creating the virtualization-based security timer. Success means no problem.", "Check only if the HRESULT is not a success."],
      "LsaSrv 6156": ["Records the result of deciding at boot whether to enable Credential Guard automatically (the hardware requirements for virtualization-based security, domain membership and licensing). A value of 0 is not an error.", "If you intend to use Credential Guard, check each value."],
      "HAL 16": ["Records that IOMMU error reporting was initialized.", "Use as a reference when investigating device DMA errors."],
      "TPM-WMI 1025": ["Records that the TPM (Trusted Platform Module) was provisioned successfully and is ready to use.", "Check the state in tpm.msc only if there are TPM-related errors."],
      "TPM-WMI 1046": ["Records that the Measured Boot log files were cleaned up (deleted).", "Check that the deleted file path is the MeasuredBoot folder."],
      "TPM-WMI 1282": ["Records that the TBS (TPM Base Services) device identifier was generated.", "Check the state only if there are TPM-related errors."],
      "TPM 18": ["A record that causes TPM provisioning and state checks to run.", "Check the state in tpm.msc only if there are TPM-related errors."],
      "Directory-Services-SAM 16962": ["Records that remote calls to the SAM (the account database) are being restricted to the default security descriptor.", "Use as a reference when reviewing security policy."],
      "Directory-Services-SAM 16977": ["Records the minimum password length setting values (MinimumPasswordLength and so on).", "Use as a reference when reviewing password policy."],
      "Directory-Services-SAM 16983": ["Records that periodic summary events began to be written for legacy-style password change calls from remote clients.", "Use as a reference when reviewing security policy."]
    }
  },

  "event-info-network.html": {
    eyebrow: "Network records",
    short: "Network service and adapter records",
    title: "DHCP, HttpService, Wi-Fi and Ethernet Adapter Records Explained",
    desc: "How to tell whether Dhcp-Client 50036/50037/50103–50106, DHCPv6-Client 51046/51047/51057, HttpService 111–114, Netwtw08 7021/7025/7026, e1rexpress 32 and BTHUSB 18 are normal.",
    lead: "Network services and adapter drivers write an information record every time they start or stop. Start and stop records repeating in pairs are normal; they become a clue only when they coincide with a real connection drop.",
    intro: [
      "Dhcp-Client and DHCPv6-Client write one line each time the service starts or stops. At shutdown several lines in a row appear, such as 50103–50106; they are step-by-step records of the shutdown procedure, so they are normal even if they look numerous.",
      "HttpService 111–114 are written when a program turns its local web-server feature on and off (for example the UPnP device discovery service). A Status of 0x0 means success."
    ],
    judge: [
      "If the internet has not actually dropped, you can ignore this group.",
      "If the symptom is not getting an IP address, look not at this group but at warning/error records such as DHCP-Client 1001, and at the IPv4 address and gateway in ipconfig /all.",
      "When Wi-Fi drops, line up the time of the Netwtw08 records with the real drop, and check the maker's wireless driver and power-management setting.",
      "When the wired LAN drops, compare the time of the e1rexpress 32 record, and cross-check with another cable, another switch port and the latest maker's driver.",
      "Check the URL and the process only when the Status in HttpService 112 and 113 is not 0x0.",
      "Only when a Bluetooth device really drops or fails to pair, check the device address and state of BTHUSB 18 in the XML and cross-test with another USB port."
    ],
    faqs: [
      ["Several Dhcp-Client records appear when I shut down.", "That is normal. 50103–50106 are step-by-step records of the shutdown procedure: registering for the shutdown notification, receiving it, the request loop ending, and waiting for the DHCPv6 service to stop."],
      ["There are Netwtw08 records. Is my wireless card faulty?", "An information-level record alone cannot tell you a wireless card is faulty. Check the driver and power management only if real Wi-Fi drops repeat and the same record coincides with them."],
      ["Are e1rexpress 32 and e2fexpress 32 the same?", "They are records with different sources. e2fexpress 32 is explained on a separate page, while e1rexpress 32 in this group is an information-level record."]
    ],
    rows: {
      "Dhcp-Client 50036": ["Records that the DHCPv4 client service started.", "If you have network problems, check the service start and stop times."],
      "Dhcp-Client 50037": ["Records that the DHCPv4 client service stopped.", "Use as a reference when checking the shutdown order."],
      "Dhcp-Client 50103": ["Records that the DHCPv4 client registered to receive shutdown notifications.", "Use as a reference when checking the shutdown order."],
      "Dhcp-Client 50104": ["Records that the DHCPv4 client received a shutdown notification.", "Use as a reference when checking the shutdown order."],
      "Dhcp-Client 50105": ["Records that the DHCPv4 client's request-processing loop received the termination event (TERMINATE_EVENT).", "Use as a reference when checking the shutdown order."],
      "Dhcp-Client 50106": ["Records that the DHCPv4 client is waiting for the DHCPv6 service to stop.", "Use as a reference when checking the shutdown order."],
      "DHCPv6-Client 51046": ["Records that the DHCPv6 client service started.", "If you have network problems, check the service start and stop times."],
      "DHCPv6-Client 51047": ["Records that the DHCPv6 client service stopped (the ShutDown flag indicates that the system is shutting down).", "Use as a reference when checking the shutdown order."],
      "DHCPv6-Client 51057": ["Records the last step of the shutdown procedure, when the DHCPv6 client service shutdown is nearly complete.", "Use as a reference when checking the shutdown order."],
      "HttpService 111": ["Records that HTTP.sys created a URL group (the path of the creating process is also recorded).", "Use the executable path to see which program opens a local server."],
      "HttpService 112": ["Records the result (Status) of HTTP.sys trying to reserve a specific URL (for example http://+:10246/MDEServer/). A Status of 0x0 means success.", "Check the URL and the process only if Status is not 0x0."],
      "HttpService 113": ["Records the result of trying to add a URL (for example http://*:2869/upnp/eventing/) to a URL group. A Status of 0x0 means success.", "Check the URL and the process only if Status is not 0x0."],
      "HttpService 114": ["Records that a URL was removed from a URL group.", "Even many repeats are normal because of service starts and stops."],
      "Netwtw08 7021": ["An informational record that the Intel wireless network driver updated an adapter state.", "Check the adapter, state and error code in the XML, and compare the time with real Wi-Fi drops."],
      "Netwtw08 7025": ["An informational event that the Intel wireless driver recorded an adapter configuration or state transition.", "Check the adapter name, state and error code in the XML."],
      "Netwtw08 7026": ["An informational event that the Intel wireless driver recorded a device/service initialization state.", "Compare the driver version in Device Manager with the event XML."],
      "e1rexpress 32": ["An informational event that the Intel wired network adapter driver recorded a link or device state.", "Check the adapter and link state in the XML, and compare the time with real drops."],
      "BTHUSB 18": ["An informational event that the state of the Bluetooth USB host controller and devices was updated.", "Check the device address, state and error code in the XML."]
    }
  },

  "event-info-power-time-update.html": {
    eyebrow: "Power, time and update records",
    short: "Power, time, sign-in and update records",
    title: "Kernel-Power 107/187/566/130/131, Time-Service, Winlogon and WindowsUpdateClient Records",
    desc: "Whether the information-level records about sleep and resume, time synchronization, sign-in/sign-out and Windows Update state are normal, and which records to read them with.",
    lead: "This group is made of information records used as supporting clues when judging an abnormal shutdown or an update failure. They do not mean a problem on their own; they gain value when you line their times up with result records such as 41, 6008, 20 and 25.",
    intro: [
      "Kernel-Power 107, 187 and 566 are information records of power-state transitions and policy handling. They do not mean a faulty power supply (PSU); when judging an abnormal shutdown, read them together with Kernel-Power 41, EventLog 6008 and the time of your own actions.",
      "Kernel-Power 130 and 131 record the time the firmware took to enter and resume from sleep (S3). They are time values, not errors, and are for comparing with other days when resume feels slow."
    ],
    judge: [
      "If there really was a reboot or blue screen, compare in time order with Kernel-Power 41 and EventLog 6008. If only information records repeat, do not replace power parts.",
      "If resume from sleep is slow, compare the FullResume value in Kernel-Power 131 with other days, and if the screen or network does not come back after resume, check the graphics/network drivers and Kernel-Power 172 together.",
      "Only when the clock is really wrong, check the last synchronization state with w32tm /query /status. Do not judge a failed motherboard battery or RTC from Time-Service records alone.",
      "Winlogon 7001 and 7002 have a different source from Service Control Manager's 7001. Compare them with surrounding events only when sign-in is delayed or there is an unexpected sign-out.",
      "WindowsUpdateClient 19, 43 and 44 are not failures if they are information records without a result code (ResultCode). Real failure is judged from the Windows Update history in Settings and follow-up records such as WindowsUpdateClient 20, 25 and 31.",
      "WHEA-Logger 19 and WindowsUpdateClient 19 only share a number. Check the source first."
    ],
    faqs: [
      ["Kernel-Power 107, 187 and 566 appear a lot. Is it the power supply?", "No. They are normal power-state transition and policy records. If there is no evidence of an abnormal shutdown (41, 6008) and no real symptom, you do not need to act."],
      ["Does WindowsUpdateClient 44 mean an update failed?", "No. 44 records that the state was refreshed after installing an update or after a reboot. Do not read an information record without a result code as a failure."],
      ["Is a long resume time (131) a failed part?", "The value alone cannot tell. When you notice a slow resume, compare with other days' values and check the graphics/network drivers and the power plan together."]
    ],
    rows: {
      "Microsoft-Windows-Kernel-Power 107": ["An informational event recording power state transitions, sleep and resume. When judging an abnormal shutdown, read it together with 41, 6008 and your own actions.", "Compare in time order with Power-Troubleshooter, Kernel-Power 41 and EventLog 6008.", "107 does not mean a power supply failure; read it together with evidence of an abnormal shutdown."],
      "Microsoft-Windows-Kernel-Power 187": ["An informational event recording a state related to power management and sleep policy. It is a supporting clue showing the context of power state transitions rather than a hardware fault.", "Compare with 41, 107, 6008 and Power-Troubleshooter from the same time."],
      "Microsoft-Windows-Kernel-Power 566": ["An informational event recording a power state change inside the power manager. Use it to line up times with sleep, resume and shutdown records.", "Compare in time order with 41, 6008 and 1074."],
      "Kernel-Power 130": ["An informational record of the time the firmware took to enter sleep (S3) (SuspendStart, SuspendEnd).", "If entering sleep is unusually slow, compare the difference between SuspendStart and SuspendEnd with other days.", "Not an error. Do not judge a failed part from the value alone."],
      "Kernel-Power 131": ["An informational record of the time the firmware took to resume from sleep (S3) (ResumeCount, FullResume, AverageResume).", "If resume feels slow, compare the FullResume value with other days.", "Not an error."],
      "Time-Service 35": ["Records that the Windows Time service started synchronizing the system time with a time source (for example time.windows.com).", "If the time is off, check the synchronization source and the network connection."],
      "Microsoft-Windows-Time-Service 37": ["A record that the Windows Time service performed synchronization or a state update.", "Check the last synchronization state with w32tm /query /status.", "Do not judge a failed motherboard battery or RTC from 37 alone; check the real clock error first."],
      "Microsoft-Windows-Winlogon 7001": ["An informational event recording the logon/logoff state of a Winlogon session.", "Record the user, session and state, and compare with the 7000-series and User Profile Service records.", "Its meaning differs from event 7001 of Service Control Manager. Do not read it as a service error without checking the source."],
      "Microsoft-Windows-Winlogon 7002": ["Records that a Winlogon user session ended or changed state. It can also appear on a normal sign-out or lock.", "Record the user, session ID and time, and compare with 6006, 1074 and User Profile Service events."],
      "Microsoft-Windows-WindowsUpdateClient 19": ["An informational event recording the state of Windows Update searching, checking or processing updates. For install failures, read the error code together with follow-up events such as 20, 25 and 31.", "Check UpdateTitle, KB and ResultCode in the event.", "Its meaning differs from WHEA-Logger 19. Check that the source is WindowsUpdateClient first."],
      "Microsoft-Windows-WindowsUpdateClient 43": ["An informational event recording the download/install state of a Windows Update operation. Judge real failure by the result code in the description and the Windows Update error message.", "Record the KB number, the result code and whether a reboot is needed.", "Do not judge a Windows Update fault from the informational 43 alone."],
      "Microsoft-Windows-WindowsUpdateClient 44": ["Records that Windows Update refreshed its state after installing an update or after a reboot. The install result and KB number are the key information.", "Check UpdateTitle, KB and ResultCode in the event.", "44 itself is not an error. Do not read an information record without a result code as a failure."]
    }
  },

  "event-info-devices.html": {
    eyebrow: "Device and driver records",
    short: "Device, driver and backup component records",
    title: "DriverFrameworks, volsnap 33, FilterManager, TPM-WMI and Sandboxie Records Explained",
    desc: "What the information records of UMDF drivers (DriverFrameworks-UserMode 10000/10002/10100), volsnap 33, FilterManager 1/6, TPM-WMI 1038/1041, Win32k 267 and SbieDrv 1101 mean, and when to check them.",
    lead: "Device drivers, file-system filters and backup (VSS) components also leave information records when they connect or load. You use them only as clues to which drivers sit in the path when there is a real device error or disk delay.",
    intro: [
      "FilterManager 6 records that a file-system filter driver loaded and registered. Programs such as antivirus, cloud sync (CldFlt) and sandboxes (SbieDrv) leave as many of them at boot as there are drivers. DeviceName tells you which drivers sit in the disk I/O path.",
      "DriverFrameworks-UserMode 10000, 10002 and 10100 are written when the user-mode driver of a device such as USB, audio or HID starts or updates its state. If the device does not actually drop, they are normal connection records."
    ],
    judge: [
      "Only when a device really drops or stops working, check DeviceName, InstanceId and Status in the XML, and compare with DriverFrameworks 10110/10111 from the same time and yellow errors in Device Manager.",
      "volsnap 33 is an information event. If backups and restore points are not failing, do not delete restore points at random. Compare whether volsnap 36, Disk or Ntfs errors appear at the same time.",
      "When there is disk delay or a blue screen, see whether DeviceName in FilterManager 6 contains an unfamiliar third-party filter driver; temporarily removing it to compare can be one of the candidates.",
      "If you do not use Sandboxie (SbieDrv), check whether to remove it. Remove it to compare only when there are game or disk-delay symptoms.",
      "For TPM-WMI 1038 and 1041, check tpm.msc and Result/Status in the XML only when BitLocker, Windows Hello or Secure Boot problems accompany them. Do not reset the TPM before you have secured the recovery key."
    ],
    faqs: [
      ["There are many FilterManager records. Is that why my disk is slow?", "The load records themselves are not a problem. But if there is disk delay or a blue screen, a third-party filter driver (antivirus, cloud sync, sandbox) can be a suspect, so check it in DeviceName and compare by temporarily removing it."],
      ["volsnap 33 appears. Is my storage faulty?", "No. It is an information event about the state of volume shadow copies and the VSS storage area. Suspect storage only when volsnap 36, Disk or Ntfs errors appear at the same time."],
      ["DriverFrameworks 10100 repeats.", "It may be normal initialization right after boot, resume from sleep or a device connection. Check the device name and the state code only when it repeats at the same time as a real device drop."]
    ],
    rows: {
      "Microsoft-Windows-DriverFrameworks-UserMode 10000": ["A state record of the UMDF driver host connecting to a device. If there is no real device error it can be read as a normal boot/connect log.", "Check the device InstanceId and DriverName in the XML.", "10000 itself is not an error event, and without a device name you cannot confirm a hardware fault."],
      "Microsoft-Windows-DriverFrameworks-UserMode 10002": ["An informational record of the user-mode device driver's framework communication/initialization state. Use it as a candidate cause only when a specific device reconnects or stops working.", "Note the device name, state and error code in the General tab and XML, and compare with 10110/10111 and Device Manager from the same time.", "A one-off information record is not evidence of faulty hardware."],
      "Microsoft-Windows-DriverFrameworks-UserMode 10100": ["An informational record written when the user-mode driver framework starts a device driver or updates its state. When a device malfunction accompanies it, check the device name and the state code in the XML.", "Check DeviceName, InstanceId, Status and DriverName in the XML.", "Do not judge a USB controller or motherboard fault from an information-level 10100 alone."],
      "volsnap 33": ["An informational event recording the state of volume shadow copies and VSS storage areas. If backups and restore points do not fail, its appearance alone does not mean a storage fault.", "Check the volume shown in the event and the result of the VSS operation.", "33 is an information event. Do not delete restore points at random unless a backup fails."],
      "FilterManager 1": ["Records that a file-system filter driver was unloaded normally (the driver name is shown in DeviceName).", "Check in DeviceName which filter driver it is (antivirus, cloud sync, sandbox and so on)."],
      "FilterManager 6": ["Records that a file-system filter driver loaded and registered with the Filter Manager. DeviceName tells you which drivers sit in the disk I/O path.", "Check whether DeviceName contains an unfamiliar driver.", "The load record itself is not a problem, but if there is disk delay or blue screens, third-party filter drivers can be candidates."],
      "SbieDrv 1101": ["A record of the Sandboxie driver (SbieDrv). On the PC that produced it, only data remained, without the message text.", "If you do not use Sandboxie, check whether to remove it, and look together with the SbieDrv load record in FilterManager 6.", "Sandbox drivers can be suspects for game or disk-delay problems, so remove it to compare only when such symptoms exist."],
      "Microsoft-Windows-TPM-WMI 1038": ["Records that the TPM WMI management component queried or updated the security chip state.", "Check the actual state with tpm.msc and Get-Tpm.", "Do not confirm a TPM fault from 1038 alone; the real security feature state matters more."],
      "Microsoft-Windows-TPM-WMI 1041": ["An informational event recording the result of a TPM WMI security chip management operation. The error state, command and target feature must be checked in the XML, and it alone is not urgent.", "Check Result, Status and Operation in the XML.", "Do not reset the TPM before you have confirmed your recovery key."],
      "Win32k 267": ["Records that touch and touchpad hardware quality assurance (HQA) validation succeeded.", "Check it together with other errors only if there are input device problems."]
    }
  }
};
