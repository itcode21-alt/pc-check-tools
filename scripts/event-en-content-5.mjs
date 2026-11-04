// English editions, batch 5 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims).

const MS = "Microsoft Learn";

export const eventEn5 = {
  "distributedcom-10005": {
    ko: "event-distributedcom-10005.html",
    source: "DistributedCOM", id: "10005", area: "Applications & services",
    title: "DistributedCOM Event 10005: Service Start Error",
    desc: "DistributedCOM 10005 records that DCOM tried to start a service it needed and got an error. The service name and error number in the description are the clues, not the event itself.",
    lead: "10005 records that DCOM tried to start a service it needs and ran into an error. The clue is not the record itself but the service name and error number written in the event description.",
    body: [
      "A dependent service that has been stopped, or whose startup type was changed, is a common cause. Check the service and the services it depends on in services.msc, and compare with Service Control Manager 7000, 7001 and 7023 at the same time."
    ],
    conditions: ["A particular feature fails to run", "A service start error during sign-in or boot", "Search, authentication or network features stop working together"],
    causes: ["A dependent service was stopped or its startup type was changed", "Damaged service files or app configuration", "A service switched off by a security policy or a clean boot"],
    checks: [
      "Write down the service name and the error number in the event description. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the state of that service and its dependent services in services.msc. Compare with the first check to narrow the cause candidates.",
      "Compare the time with Service Control Manager 7000, 7001 and 7023. If it still reproduces at this step, move on to the next item.",
      "If it is a needed service, consider repairing the Windows component or reinstalling the app. See whether the symptoms differ before and after the change."
    ],
    caution: ["Do not switch every service to automatic start in one go or edit the registry."],
    faqs: [
      ["Does changing all services to automatic fix it?", "It is not recommended. Check only the services you need; a bulk change can cause boot delays or conflicts."],
      ["Where do I find the error number?", "It is written in the event description together with the service name. Note the number and look up the explanation of the same Windows error code."]
    ],
    refs: [],
    related: ["distributedcom-10016", "distributedcom-10010", "service-7000", "service-7001", "service-7023"]
  },

  "distributedcom-10010": {
    ko: "event-distributedcom-10010.html",
    source: "DistributedCOM", id: "10010", area: "Applications & services",
    title: "DistributedCOM Event 10010: Server Did Not Register in Time",
    desc: "DistributedCOM 10010 records that a DCOM server did not register within the time limit. Link it to a real symptom only when sign-in or app launch is actually slow.",
    lead: "10010 records that a DCOM server did not register within the time limit. It means something only when it appears at the same time as a real delay in sign-in or app launch; if it repeats only at boot without any malfunction, it is something to observe.",
    body: [
      "The CLSID and AppID in the event description tell you which component it is. Looking at it together with Service Control Manager 7000, 7009 and 7011 at the same time helps you judge whether a slow service start is the cause."
    ],
    conditions: ["A delay of about 10–15 seconds right after sign-in", "A particular app, widget or service starts slowly", "Repeats only at boot with no malfunction"],
    causes: ["The linked service has not started yet", "A delay in an app component or Windows app package", "High storage or CPU load", "A recent app update or a service configuration conflict"],
    checks: [
      "Write down the CLSID, AppID and server name from the event. Start with what is easy to undo so you can narrow the range without risk.",
      "Compare with Service Control Manager 7000, 7009 and 7011 at the same time. Compare with the first check to narrow the cause candidates.",
      "Check whether there really is an app or feature that is delayed. If it still reproduces at this step, move on to the next item.",
      "Compare whether it reproduces after repairing or updating the app and in a clean boot. See whether the symptoms differ before and after the change."
    ],
    caution: ["Do not apply a fix that simply changes permissions, as you might for 10016, first. If there is no malfunction it may only need observing."],
    faqs: [
      ["10010 appears at every boot. Should I fix it?", "If there is no malfunction or delay you do not need to act urgently. Only if sign-in is slow for a few seconds along with it, narrow the cause down with a clean boot and similar steps."],
      ["Should I change DCOM permissions as with 10016?", "No. 10010 is a registration-timeout record, not a permission denial, so changing permissions is unrelated. Do not change DCOM permissions casually."]
    ],
    refs: [],
    related: ["distributedcom-10016", "distributedcom-10005", "service-7000", "service-7009", "service-7011"]
  },

  "distributedcom-10029": {
    ko: "event-distributedcom-10029.html",
    source: "DistributedCOM", id: "10029", area: "Applications & services",
    title: "DistributedCOM Event 10029: Timed Out Waiting for a Service to Stop",
    desc: "DistributedCOM 10029 records a timeout while activating a COM component and waiting for the related service to stop. For example, the Xbox Game Bar capture component can fail waiting for BcastDVRUserService to stop.",
    lead: "DistributedCOM 10029 is an error-level record that, while trying to activate a COM component, the system timed out waiting for the related service to stop. For example, there are cases on the Game Bar capture component such as “AppCaptureShell activation timed out waiting for BcastDVRUserService to stop”.",
    body: [
      "It mostly appears at sign-out or shutdown, when a service stop and an activation request overlap, and in many cases there is no clear symptom. If there is none you do not need to act; only if shutdown is unusually slow or Game Bar causes freezes, turn that feature off and compare."
    ],
    conditions: ["When stopping Game Bar or screen-capture services, or at sign-out or shutdown", "A COM activation request arrives while a user service is stopping"],
    causes: ["Another component requested activation while the service was slow to stop", "The shutdown timing of the Xbox Game Bar capture and broadcast components"],
    checks: [
      "Use the CLSID and the service name (param1, param2) to identify the component. Start with what is easy to undo so you can narrow the range without risk.",
      "If it is Game Bar related, turn off the Game Bar and capture features in Settings and see whether it recurs. Compare with the first check to narrow the cause candidates.",
      "Check the repeat count together with whether a real symptom (slow app shutdown, freezing) exists. If it still reproduces at this step, move on to the next item."
    ],
    caution: ["Although it is logged as an error, it is usually not urgent when there are no symptoms. Do not suspect a hardware failure from this event alone."],
    faqs: [
      ["10029 repeats. Is something wrong with the PC?", "If there are no symptoms, usually not. It is a record left when a service stop and an activation request overlap at shutdown. Check the service only when shutdown is slow or apps freeze."],
      ["Can I turn off the Game Bar?", "If you do not use screen capture or recording, you can turn off the Game Bar and background recording in Windows Settings. After turning them off, compare whether the same event still appears to narrow the cause."]
    ],
    refs: [],
    related: ["service-7000", "service-7009", "distributedcom-10016", "application-hang-1002"]
  },

  "service-7022": {
    ko: "event-service-7022.html",
    source: "Service Control Manager", id: "7022", area: "Applications & services",
    title: "Service Control Manager Event 7022: Service Hung on Starting",
    desc: "Service Control Manager 7022 records that a service stopped responding while it was starting. The service name is in the event body, so check which service it is and the 7000 and 7009 records at the same time.",
    lead: "7022 records that a service stopped responding in the middle of starting. Where 7000 is logged when the start itself failed, 7022 is logged when it hung during the start.",
    body: [
      "Microsoft's documentation suggests starting the service manually as a resolution. If it works when started manually, suspect a boot-time ordering or load problem; if it hangs even when started manually, suspect the service itself or one of its dependencies."
    ],
    conditions: ["A feature starts late right after boot", "The service seems stuck when started manually", "Service start errors such as 7000, 7009 and 7011 appear with it"],
    causes: ["Another service or driver that it depends on is not ready yet", "Starting while storage or CPU load is high", "Damaged program files or a configuration conflict", "An error in the service's own startup code"],
    checks: [
      "Check the service name and display name in the event. Start with what is easy to undo so you can narrow the range without risk.",
      "Try starting that service manually in the service manager. Compare with the first check to narrow the cause candidates.",
      "Check the state of the dependent services on the Dependencies tab of its properties. If it still reproduces at this step, move on to the next item.",
      "Compare with 7000, 7009 and 7011 and the storage events at the same time. See whether the symptoms differ before and after the change.",
      "Compare whether it reproduces after updating or repairing the related program. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "Before deleting a service or changing its startup type, first check which program the service belongs to.",
      "If it is a core Windows service, make a restore point or a backup before editing the registry directly."
    ],
    faqs: [
      ["How are 7009 and 7022 different?", "7009 is a record that the service did not send a connection response within the time limit, and 7022 is a record that the service hung while starting. They can be logged together for the same service, so compare the time and the service name."],
      ["It works when I start it manually but hangs only at boot.", "It may be a start-order or load problem. First check program updates and the dependent services, and try changing the startup type only if the program manufacturer allows it."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-R2-and-2008/dd349362(v=ws.10)", `${MS}: Event ID 7022 — Service Start Operations (Windows Server 2008 R2 documentation)`]
    ],
    related: ["service-7000", "service-7001", "service-7009", "service-7011", "service-7023"]
  },

  "service-7032": {
    ko: "event-service-7032.html",
    source: "Service Control Manager", id: "7032", area: "Applications & services",
    title: "Service Control Manager Event 7032: Service Recovery Action Failed",
    desc: "Service Control Manager 7032 records that after a service stopped, the recovery action Windows scheduled (for example restarting the service) failed as well.",
    lead: "7032 records that the recovery action Windows tried after a service stopped has failed. Read the event where the service stopped once (7031, 7034) and the event where even the recovery then failed as two separate things.",
    body: [
      "Microsoft's documentation tells you to check and change a service's recovery actions on the Recovery tab of its properties. The failure reason is written in the event body, so the direction of the check differs depending on whether the sentence says “already running” or “cannot be started”."
    ],
    conditions: ["The service is not restarted automatically after it stopped", "It follows right after a 7031 or 7034 record", "The service's recovery setting is “Restart the service”"],
    causes: ["The same service is already running when the restart is attempted, or a dependency is not ready", "A problem with the service file, permissions or account", "A program crash makes the service stop immediately again and again"],
    checks: [
      "Write down the service name, the recovery action tried and the failure sentence in the event. Start with what is easy to undo so you can narrow the range without risk.",
      "On the Recovery tab of the service properties, check the actions for the first and second failure. Compare with the first check to narrow the cause candidates.",
      "Compare 7031, 7034 and Application Error 1000 at the same time. If it still reproduces at this step, move on to the next item.",
      "Start the service manually and see whether it starts. See whether the symptoms differ before and after the change.",
      "Update or repair the related program. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "Changing the recovery action to “Restart the computer” can hide the cause, so it is not recommended unless it is a service you really need.",
      "Do not change the service account or permissions without knowing the cause."
    ],
    faqs: [
      ["How do I read a 7032 after a 7031?", "It means the service stopped (7031) and even the scheduled recovery action (such as restarting the service) failed. Check whether the service is still stopped and whether a manual start works."],
      ["Will changing the recovery settings fix it?", "The recovery action is only a response after a failure; it does not fix why the service stopped. Find the cause of the repeated stops (a crash, settings, a dependent service) first."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc756373(v=ws.10)", `${MS}: Event ID 7032 — Service Stop Operations (Windows Server 2008 R2 documentation)`]
    ],
    related: ["service-7031", "service-7034", "service-7000", "service-7009", "application-error-1000"]
  },

  "service-7038": {
    ko: "event-service-7038.html",
    source: "Service Control Manager", id: "7038", area: "Applications & services",
    title: "Service Control Manager Event 7038: Service Logon Failed",
    desc: "Service Control Manager 7038 records that a service could not log on with its configured account and password. A changed password or a disabled or expired account is the typical cause.",
    lead: "7038 records that a service could not start because it failed to log on as the specified account. On an ordinary PC it mainly appears when the password or state of the account has changed for a program that assigns a separate account to its service.",
    body: [
      "Microsoft Learn's guide to SQL Server service error 1069 also lists a changed password or a disabled account as common causes of 7038. The error sentence in the event body (for example a disabled account or a wrong password) decides the direction of the check."
    ],
    conditions: ["A service does not start right after a password or account-policy change", "It occurs in programs that assign a separate user account to a service (backup, database, security software and so on)", "Service start failure records such as 7000 appear with it"],
    causes: ["The password stored in the service differs from the current account password", "The account is disabled, locked or expired", "The account name was changed or deleted"],
    checks: [
      "Write down the service name, the logon account and the error sentence in the event. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the Log On tab of the service properties. Compare with the first check to narrow the cause candidates.",
      "Check whether the account is usable (not disabled, locked or expired). If it still reproduces at this step, move on to the next item.",
      "Re-enter the current password, save it and start the service. See whether the symptoms differ before and after the change.",
      "If it is a “Log on as a service” right problem, check whether a 7041 record is also logged at the same time. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "Do not try to fix it by granting the service account administrator rights; give only the minimum rights needed.",
      "Do not leave the password in an event-log capture or in an inquiry post."
    ],
    faqs: [
      ["7038 appears even though I did not change the password.", "The same record is logged when the account has been disabled, locked or expired, or renamed. Check the error sentence in the event body first."],
      ["How are 7038 and 7041 different?", "Both record a service logon failure. 7041 is sometimes logged together for a logon-type problem such as the “Log on as a service” right, so if you see both for the same service, check the account's rights as well."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2008-r2-and-2008/cc756341(v=ws.10)", `${MS}: Event ID 7038 — Service Start Operations (Windows Server 2008 R2 documentation)`],
      ["https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/startup-shutdown/error-1069-service-cannot-start", `${MS}: Error 1069 — SQL Server service cannot start`]
    ],
    related: ["service-7000", "service-7001", "service-7009", "service-7011", "service-7023"]
  },

  "tcpip-4199": {
    ko: "event-tcpip-4199.html",
    source: "Tcpip", id: "4199", area: "Network",
    title: "Tcpip Event 4199: IP Address Conflict",
    desc: "Tcpip 4199 records that TCP/IP detected an IP address conflict on the same network. The conflicting address and the hardware address of the other device are the key clues.",
    lead: "Tcpip 4199 records that Windows detected the same IP address being used twice on the network. As Microsoft describes, it can also appear as duplicate detection while receiving a DHCP address, so first write down the conflicting address shown on the General tab and the hardware address of the other party.",
    body: [
      "If it happened once and the internet and the local network are fine, it may have been a temporary DHCP or wake-from-sleep situation. Only when there are repeated disconnections or IP conflict notifications should you check the router's lease list and the fixed-IP configuration together."
    ],
    conditions: ["No internet after boot or wake from sleep", "An IP address conflict notification or a dropped connection", "Right after a DHCP renewal, a router restart or a VPN connection"],
    causes: ["The router or DHCP server leases an address that is already in use", "A fixed IP overlaps with a DHCP address", "A duplicate address is detected while switching after wake from sleep, a VPN or a virtual adapter", "A router firmware or network-device address-management problem"],
    checks: [
      "From the General tab and the XML, write down the conflicting IP address, the other party's hardware address and the adapter name. Start with what is easy to undo so you can narrow the range without risk.",
      "Check whether DHCP is used and the current address with ipconfig /all, and check for a duplicate fixed IP. If “DHCP Enabled” is “Yes”, the address comes from the router; if “No”, it is a fixed IP. Compare with the first check to narrow the cause candidates.",
      "Compare the router's DHCP lease list with its fixed assignments. If it still reproduces at this step, move on to the next item.",
      "Compare whether it reproduces with the VPN and virtual adapters turned off, and on another router or cable. See whether the symptoms differ before and after the change.",
      "If it repeats, update the PC and router firmware and the network driver and review the DHCP lease information. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "If it happened once or twice and there is no problem using the internet, it may be a temporary duplicate detection. Adjust the address allocation only when there are repeated disconnections.",
      "Before arbitrarily fixing the same IP or narrowing the DHCP range, check the configuration of the other devices on the current network."
    ],
    faqs: [
      ["Is 4199 evidence of hacking or malware?", "No. It is a network event that records detection of a duplicate IP address. It can also occur with router DHCP, a fixed IP, or a VPN or virtual adapter configuration, so do not conclude it is a security problem."],
      ["What should I check first when 4199 repeats?", "Write down the conflicting IP from the event, check whether it is DHCP or a fixed IP in ipconfig /all, and compare with the router's DHCP lease list. Checking whether it reproduces with the VPN off or on another router also narrows the range."]
    ],
    refs: [],
    related: ["tcpip-4266", "dns-1014", "dhcp-client-1001", "wlan-autoconfig-10002", "schannel-36874"]
  },

  "tcpip-4266": {
    ko: "event-tcpip-4266.html",
    source: "Tcpip", id: "4266", area: "Network",
    title: "Tcpip Event 4266: Network Stack Error",
    desc: "Tcpip 4266 records an error the TCP/IP stack hit while handling a connection or socket. 4266 alone cannot confirm a faulty network card; read the error sentence together with the interface, address and error code in the XML.",
    lead: "Tcpip 4266 records an error the TCP/IP network stack hit while handling a connection or socket. The event ID alone cannot confirm a faulty network card, so check the error sentence on the General tab together with the interface, address and error code in the XML.",
    body: [
      "Separating whether it appears only after a VPN or virtual adapter is connected, and whether it repeats when the number of connections grows (games, large transfers, remote access), helps you divide a driver problem from a network-path problem."
    ],
    conditions: ["The network connection dropped and reconnected", "Right after connecting or disconnecting a VPN or virtual adapter", "A network error during a large transfer, a game or remote access"],
    causes: ["A conflict in the network adapter driver or a filter driver", "A network filter in a VPN, virtual switch or security program", "Compatibility of TCP/IP settings, IPv4/IPv6 or offload features", "A temporary problem with the router, cable or wireless link"],
    checks: [
      "From the General tab and the XML, write down ErrorCode, the interface name and the local and remote addresses. Start with what is easy to undo so you can narrow the range without risk.",
      "Compare with 4199, DHCP 1001, DNS 1014 and network-driver events at the same time. Compare with the first check to narrow the cause candidates.",
      "Check the address, gateway and adapter state with ipconfig /all and Get-NetIPConfiguration. If it still reproduces at this step, move on to the next item.",
      "Detach the VPN, virtual networks and security filters for a while and compare whether it reproduces with the manufacturer's network driver. See whether the symptoms differ before and after the change.",
      "If the drops continue, cross-check with another cable, another router port and another network. If it is still unsolved after all this, review the next cause."
    ],
    caution: ["Do not start with a TCP/IP reset or replacing the network card just from the ID 4266. First check that the time of the event matches a real connection failure."],
    faqs: [
      ["Do I have to replace the network card when 4266 appears?", "No. The network driver, a VPN or security filter, the router and the cable can also produce the same record. First check whether the time of the event matches a real disconnection."],
      ["Are 4266 and 4199 the same error?", "They share the Tcpip source but can mean different things. The point of 4199 is an IP address conflict, while for 4266 you must look at the detailed error sentence and the XML to tell which part of the processing went wrong."]
    ],
    refs: [],
    related: ["tcpip-4199", "dns-1014", "dhcp-client-1001", "wlan-autoconfig-10002", "schannel-36874"]
  },

  "wlan-autoconfig-10002": {
    ko: "event-wlan-autoconfig-10002.html",
    source: "WLAN-AutoConfig", id: "10002", area: "Network",
    title: "WLAN-AutoConfig Event 10002: Wireless Extensibility Module Stopped",
    desc: "WLAN-AutoConfig 10002 records that a wireless extensibility module stopped. It usually appears while a wireless driver or a manufacturer extension module restarts, so first check whether it matches the time Wi-Fi dropped.",
    lead: "10002 records that a wireless extensibility module has stopped. It appears while a wireless driver or a manufacturer's extension module is restarting, so first look at whether it is the same time Wi-Fi dropped.",
    body: [
      "Write down the Module Path in the event and the wireless adapter model, and check the driver version in Device Manager. If Wi-Fi works and it was a one-off, do not uninstall the driver just from the record. It is also worth comparing whether it is the same time as a record of 8002 (connection failure)."
    ],
    conditions: ["Wi-Fi drops and reconnects", "Wireless instability after wake from sleep", "Right after a driver update or a switch between wireless networks"],
    causes: ["A conflict in the wireless driver or its extension module", "A conflict between the manufacturer's wireless utility and the Windows WLAN service", "An adapter power-management or wake-from-sleep problem", "A temporary link change while switching routers"],
    checks: [
      "Write down the Module Path in the event and the wireless adapter model. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the wireless driver version in Device Manager. Compare with the first check to narrow the cause candidates.",
      "Update or roll back to the manufacturer's driver and compare whether the wireless management utility conflicts. If it still reproduces at this step, move on to the next item.",
      "If the Wi-Fi connection is fine and it was a one-off, do not uninstall the driver just because the errors accumulate. See whether the symptoms differ before and after the change."
    ],
    caution: ["Do not conclude that the wireless card is faulty just because 10002 exists. The time must match repeated real disconnections."],
    faqs: [
      ["Does 10002 mean the wireless card is broken?", "The record alone cannot show a failure. The standard is whether real disconnections repeat at the same time."],
      ["What should I do about the driver?", "Update to the manufacturer's latest driver, or, if it started right after an update, roll back to the previous version and compare."]
    ],
    refs: [],
    related: ["wlan-autoconfig-8002", "dns-1014", "dhcp-client-1001", "tcpip-4266"]
  },

  "vss-8193": {
    ko: "event-vss-8193.html",
    source: "VSS", id: "8193", area: "Storage",
    title: "VSS Event 8193: Volume Shadow Copy Error",
    desc: "VSS 8193 records that the Volume Shadow Copy Service (VSS) failed with an error. It affects backup software and the creation of system restore points.",
    lead: "8193 is a record that the Volume Shadow Copy Service (VSS) failed with an error, and it mainly appears while backup software runs or a system restore point is being created. Use the error code shown in the event description to narrow the cause.",
    body: [
      "First check that there is enough free disk space, and if you use several backup programs together, keep open the possibility of a conflict between VSS writers."
    ],
    conditions: ["Creating a system restore point fails", "A backup software error", "A Windows Server Backup failure"],
    causes: ["Not enough disk space", "A VSS service or writer error", "Slow storage response during a backup"],
    checks: [
      "Check the error code in the event description. Start with what is easy to undo so you can narrow the range without risk.",
      "Check the free space of the shadow copy storage. Compare with the first check to narrow the cause candidates.",
      "Check the state of the writers with the vssadmin list writers command. Use this to verify the next cause when the earlier steps did not solve it."
    ],
    caution: ["If this event repeats, system restore points may not be getting created."],
    faqs: [
      ["Does 8193 mean the backup failed?", "It is likely that the backup software or system restore failed while using VSS. Also check the backup program's run log to confirm whether it really completed."],
      ["How do I run vssadmin list writers?", "Type vssadmin list writers in an administrator command prompt and the state of each writer is shown. If a writer is in an error state, try restarting the related service."]
    ],
    refs: [],
    related: ["volsnap-36", "volsnap-25", "vss-8194", "disk-7"]
  },

  "vss-8194": {
    ko: "event-vss-8194.html",
    source: "VSS", id: "8194", area: "Storage",
    title: "VSS Event 8194: IVssWriterCallback Access Denied",
    desc: "VSS 8194 records that VSS (the Volume Shadow Copy Service), while querying a component such as the System Writer, failed with “access denied” (0x80070005). Reports say the record can remain even when the backup completes normally.",
    lead: "8194 is a record that VSS failed with access denied while querying the callback interface a writer provides. It is usually a situation where the service account lacks COM access permission, and whether the backup actually failed has to be checked separately.",
    body: [
      "Several backup vendors' documents report that this record is also left in environments where the backup completes normally, but you cannot assume it is harmless in every environment. Move on to the permission check when the backup result shows a failure or vssadmin list writers shows an error state."
    ],
    conditions: ["It is left every time a backup or restore program runs", "An error when running vssadmin list writers", "VSS 8193 records are logged with it"],
    causes: ["The service account (Network Service and so on) has no access permission to the COM component VSS requested", "Security software or a policy limits the service's permissions", "A service-permission configuration in a cluster environment"],
    checks: [
      "Write down the error code in the event body (such as 0x80070005) and the component that was called. Start with what is easy to undo so you can narrow the range without risk.",
      "In an administrator command prompt, check with vssadmin list writers whether any writer is in an error state. Compare with the first check to narrow the cause candidates.",
      "Check whether the backup job really succeeded. If it still reproduces at this step, move on to the next item.",
      "Compare with VSS 8193 at the same time. See whether the symptoms differ before and after the change.",
      "Change COM permissions only after checking the backup software manufacturer's and Microsoft's guidance. If it is still unsolved after all this, review the next cause."
    ],
    caution: [
      "DCOM and COM security permissions are hard to undo once changed. If the backup completes normally, do not change permissions just because of the record.",
      "Make a restore point before changing permissions."
    ],
    faqs: [
      ["8194 appears but the backup succeeds. Can I ignore it?", "If the backup completes normally and there are no other errors, it is often kept as something to observe. If a backup failure or a writer error state is present as well, find the cause."],
      ["Will changing DCOM permissions fix it?", "In an environment where lacking permission is the cause it may help, but it is hard to undo once changed. Proceed only after securing the manufacturer's and Microsoft's guidance and a restore point."]
    ],
    refs: [
      ["https://support.microsoft.com/en-us/help/2991246", "Microsoft Support: “Access denied” error when running a backup or vssadmin list (KB2991246, hotfix for cluster environments)"]
    ],
    related: ["vss-8193", "volsnap-36", "volsnap-25"]
  },

  "volsnap-25": {
    ko: "event-volsnap-25.html",
    source: "Volsnap", id: "25", area: "Storage",
    title: "Volsnap Event 25: Why Shadow Copies Were Deleted and What to Check",
    desc: "Volsnap 25 records that shadow copies of a volume (such as System Protection restore points) were deleted because the storage space could not grow in time.",
    lead: "Volsnap 25 is an error-level record that the shadow copies of a volume (for example C:) were deleted because the shadow copy storage space could not grow in time. It means the reference point for features that depend on volume shadow copies, such as system restore points and Previous Versions, may be gone.",
    body: [
      "It occurs in the middle of a large copy, install or backup that crowds disk I/O, or when the volume has almost no free space. If it repeats, raise the maximum usage for System Protection and free up space, and also check with the Disk and Ntfs events at the same time whether the storage device itself is a problem."
    ],
    conditions: ["Shadow copy storage space runs short while disk I/O is heavy", "System Protection or a backup program is using volume shadow copies"],
    causes: ["The shadow copy storage space is short or grows too slowly to keep up with I/O", "High disk load during a large copy, install or backup", "A volume that is almost full"],
    checks: [
      "Check the deleted volume (VolumeName) and the time. Start with what is easy to undo so you can narrow the range without risk.",
      "In the System Protection settings, check and raise the maximum usage for that drive. Compare with the first check to narrow the cause candidates.",
      "Check the free disk space and any large job (backup, copy) at the same time. If it still reproduces at this step, move on to the next item.",
      "Check whether there are Disk and Ntfs errors at the same time. See whether the symptoms differ before and after the change."
    ],
    caution: ["Restore points may have disappeared, so if you need an important recovery reference point, make a new backup. Do not conclude a disk failure from this event alone."],
    faqs: [
      ["Did I lose my restore points when Volsnap 25 appears?", "It is a record that the shadow copies of that volume were deleted, so the restore points from that time may be gone. Check the remaining restore points in the System Protection settings and create a new one if needed."],
      ["Has the disk failed?", "This event often appears with storage-space or load problems and on its own is not grounds for a disk failure. Check whether events such as Disk 7, 11 and 153 and Ntfs 55 are present together."]
    ],
    refs: [],
    related: ["volsnap-36", "vss-8193", "disk-7", "ntfs-55"]
  }
};
