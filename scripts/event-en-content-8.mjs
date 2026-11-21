// English editions, batch 8 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims). Screenshots on the Korean pages are
// not carried over (the English generator has no image support).

export const eventEn8 = {
  "eventlog-6013": {
    ko: "event-eventlog-6013.html",
    source: "EventLog", id: "6013", area: "Power & shutdown",
    title: "EventLog Event 6013: System Uptime Record",
    desc: "EventLog 6013 is an informational event that records the time elapsed since the system booted (uptime) in seconds. It is generated once a day.",
    lead: "6013 is an informational event that records the time elapsed since the system booted (uptime) in seconds. It is generated automatically every day and does not mean a problem by itself.",
    body: [
      "If the uptime is repeatedly recorded as much shorter than expected, there was a reboot at that time, so also check shutdown-related events from the same moment, such as Kernel-Power 41 or EventLog 6008."
    ],
    conditions: ["Generated regularly once a day"],
    causes: ["Normal operation — recorded automatically every day"],
    checks: [
      "If the uptime is very short, check whether there was an unexpected reboot.",
      "Compare it with a Kernel-Power 41 event on the same date."
    ],
    caution: ["It is an informational event and is not a problem by itself."],
    faqs: [
      ["Do I need to act on 6013 right away?", "No. It is an informational event recorded automatically every day and is not a problem by itself. Only when the uptime value is repeatedly abnormally short do you need to look at it together with other events."],
      ["What should I suspect if the uptime is short?", "It means there was an unexpected reboot, so also check Kernel-Power 41, WHEA and EventLog 6008 events from the same date and time to narrow down the cause of the reboot."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "user32-1074", "volmgr-162", "power-sleep-wake"]
  },
  "kernel-boot-20": {
    ko: "event-kernel-boot-20.html",
    source: "Kernel-Boot", id: "20", area: "Power & shutdown",
    title: "Kernel-Boot Event 20: Reading the Last Shutdown and Boot Success Status",
    desc: "Kernel-Boot event 20 records at boot whether the previous shutdown and the previous boot finished normally (LastShutdownGood and LastBootGood).",
    lead: "Kernel-Boot 20 records at boot whether the previous shutdown and the previous boot ended successfully, in text such as \"The last shutdown's success status was true. The last boot's success status was true.\" When you investigate an unexpected reboot, it is a useful clue that tells you in one line whether the previous shutdown was normal.",
    body: [
      "If LastShutdownGood is false, the previous shutdown did not go through the normal procedure, so check whether it appears at the same time as Kernel-Power 41 or EventLog 6008. If it is true, the suspicion of a forced shutdown is smaller, but you still need to look at the records of other boots as well."
    ],
    conditions: ["Every boot"],
    causes: ["true if the previous shutdown was normal; false for a forced shutdown, a power cut or a blue screen"],
    checks: [
      "Check whether LastShutdownGood is false.",
      "If it is false, compare with Kernel-Power 41 and EventLog 6008 from the same time.",
      "Use LastBootId to tell which boot it belongs to."
    ],
    caution: ["true/true means both the previous shutdown and the previous boot were normal."],
    faqs: [
      ["Does LastShutdownGood = false always mean a fault?", "No. A forced shutdown, a power outage, holding the power button and a blue screen can also make it false. Narrow it down with the number of repeats and 41, 6008 and BugCheck 1001 from the same time."],
      ["Can I count reboots with this event?", "It is left once per boot, so together with LastBootId it helps you tell the boots apart and find the point where false repeats."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6005", "power-sleep-wake"]
  },
  "kernel-boot-247": {
    ko: "event-kernel-boot-247.html",
    source: "Kernel-Boot", id: "247", area: "Power & shutdown",
    title: "Kernel-Boot Event 247: Reading the Pluton Firmware Load Failure Record",
    desc: "A record that the firmware for the Pluton security processor could not be applied. If StatusCode is STATUS_SUCCESS, boot is often not affected.",
    lead: "Kernel-Boot 247 is a record left with the text \"Unable to load Pluton-Windows firmware\". It means Windows tried to apply the Microsoft Pluton security processor firmware and could not. When StatusCode is shown together as STATUS_SUCCESS, as on this PC, boot continued normally.",
    body: [
      "The wording looks like an error, but it can be left at every boot even on a PC without Pluton, so if there is no boot delay or security feature problem you can ignore it. If you do have a symptom, check the TPM state, the BIOS security settings and motherboard firmware updates."
    ],
    conditions: ["Every boot (on a PC that has no Pluton security processor or does not need firmware applied)"],
    causes: ["An informational record that is also left on a CPU or motherboard without Pluton", "Windows tried to apply Pluton firmware and there was nothing to apply"],
    checks: [
      "Check the StatusCode and Reason values.",
      "Check whether there is any problem with boot speed or security features (TPM, memory integrity).",
      "Check whether the motherboard or CPU maker supports Pluton."
    ],
    caution: ["The wording \"Unable to load\" makes it look like an error, but if there is no symptom you do not have to do anything."],
    faqs: [
      ["It says Pluton firmware could not be loaded — is there a security problem?", "If StatusCode is STATUS_SUCCESS and the TPM and memory integrity are normal, it is hard to treat it as a problem. This record can be left even on a PC without Pluton."],
      ["Can I get rid of this event?", "It is an informational record, so you can leave it alone. You can update the motherboard BIOS to the latest version, or adjust a Pluton-related BIOS setting if one exists, following the manual."]
    ],
    refs: [],
    related: ["time-service-134", "eventlog-6005", "eventlog-6013"]
  },
  "kernel-general-1": {
    ko: "event-kernel-general-1.html",
    source: "Kernel-General", id: "1", area: "Network",
    title: "Kernel-General Event 1: Reading the System Time Change Record",
    desc: "Kernel-General event 1 records that the system time was changed, together with the old time, the new time, the difference (Time Delta) and the reason (Reason).",
    lead: "Kernel-General 1 records the old time, the new time, the difference (Time Delta) and the reason when the system time was changed. For example, 'System time synchronized with the hardware clock' means the time was corrected by synchronizing with the hardware clock.",
    body: [
      "A record with a small difference left after waking from sleep or after the time service synchronizes is normal. If the difference is large and the reason is unclear, or the time drifts at every boot, check the motherboard CMOS battery and the BIOS clock setting."
    ],
    conditions: ["During time synchronization, on waking from sleep, or when the time is changed manually"],
    causes: ["The system time was synchronized with the hardware clock", "A normal correction by the time service", "The time was changed by a user or a program"],
    checks: [
      "Check Time Delta (ms) and Reason.",
      "If the difference is large and the reason is unclear, check the BIOS clock and the motherboard (CMOS) battery.",
      "Check whether Process is a program that changes the time."
    ],
    caution: ["If Reason is synchronization with the hardware clock and the difference is small, it is a normal correction."],
    faqs: [
      ["It says the system time changed — who changed it?", "Look at Process and Reason in the body. If it is the time service (w32time) or hardware clock synchronization it is normal; if an unfamiliar program appears, check that program."],
      ["What if the time drifts at every boot?", "A drained CMOS battery (the coin cell on the motherboard) is a common cause. If it repeats even after you set the BIOS clock, try replacing the battery."]
    ],
    refs: [],
    related: ["time-service-134", "time-service-158", "eventlog-6005", "eventlog-6013"]
  },
  "kernel-general-12": {
    ko: "event-kernel-general-12.html",
    source: "Kernel-General", id: "12", area: "Power & shutdown",
    title: "Kernel-General Event 12: Operating System Start Time Record",
    desc: "Kernel-General event 12 is an informational record of the system time at which the operating system started. It is used as the starting point of a boot session.",
    lead: "Kernel-General 12 is an operating system start record left as 'The operating system started at system time …', and its body also contains the Windows version, build and boot mode. It is useful as a reference point for telling boot sessions apart.",
    body: [
      "If you pair this event with Kernel-General 13, the shutdown record, you can calculate how many minutes the PC stayed on. If 12 continues without a 13, it means the PC went off without a shutdown record, so check it together with Kernel-Power 41."
    ],
    conditions: ["Every boot"],
    causes: ["A normal boot record"],
    checks: [
      "Pair the start time with the shutdown record (Kernel-General 13) and calculate the session length.",
      "If 12 appears without a 13 before it, check whether a normal shutdown was not recorded.",
      "Compare with Kernel-Power 41 from the same time."
    ],
    caution: ["It is an informational record and is not a problem by itself."],
    faqs: [
      ["Is 12 left at every boot?", "Yes, once per boot. The number of records should equal the number of boots."],
      ["What if there is a 12 but no 13?", "It may mean the previous shutdown ended without a normal record. Check Kernel-Power 41 or EventLog 6008 from the same time to separate a forced shutdown, a power outage and a crash."]
    ],
    refs: [],
    related: ["kernel-general-13", "kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6005", "power-sleep-wake"]
  },
  "kernel-general-13": {
    ko: "event-kernel-general-13.html",
    source: "Kernel-General", id: "13", area: "Power & shutdown",
    title: "Kernel-General Event 13: Operating System Shutdown Time Record",
    desc: "Kernel-General event 13 records the system time at which the operating system shuts down. It is the last trace of a normal shutdown procedure.",
    lead: "Kernel-General 13 is an operating system shutdown record left as 'The operating system is shutting down at system time …'. It is left when the normal shutdown procedure completes, so its presence is a clue that the shutdown was not a sudden power cut.",
    body: [
      "Whether the record is missing matters more than whether it is there. If there is no 13 before a boot, the PC went off without the normal shutdown procedure, so narrow down the cause (a power outage, a power problem, a crash or a forced shutdown) together with Kernel-Power 41 and EventLog 6008 from the same time."
    ],
    conditions: ["Every time the PC shuts down or restarts normally"],
    causes: ["A normal shutdown record"],
    checks: [
      "Pair the shutdown time with Kernel-General 12 of the next boot.",
      "Check whether there is a boot with no 13.",
      "Check whether that boot has a Kernel-Power 41."
    ],
    caution: ["It is an informational record and is not a problem by itself. The fact that 13 is missing is the more important clue."],
    faqs: [
      ["Does a 13 always mean a normal shutdown?", "It is a strong clue that the normal shutdown procedure ran. But if Kernel-Power 41 follows this record, there may have been another problem during shutdown, so check them together."],
      ["What if shutdowns without a 13 repeat?", "You can suspect causes such as the power supply, overheating, drivers or memory. Compare the repeat times of Kernel-Power 41 with WHEA-Logger records."]
    ],
    refs: [],
    related: ["kernel-general-12", "kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6005", "power-sleep-wake"]
  },
  "kernel-power-577": {
    ko: "event-kernel-power-577.html",
    source: "Kernel-Power", id: "577", area: "Power & shutdown",
    title: "Kernel-Power Event 577: System-Initiated Reboot Preparation Record",
    desc: "Kernel-Power event 577 is an informational record that the system prepared a reboot it starts by itself, such as a restart after an update or a driver installation.",
    lead: "Kernel-Power 577 is a record that the system prepared a reboot it starts by itself (a system initiated reboot). It is the trace of normal behavior left when Windows asks for a restart, for example after an update or a driver installation.",
    body: [
      "If the PC restarted even though you did not restart it, first check whether there is a Windows Update or installation event at the same time as this event. If there is no Kernel-Power 41 after this event, it was a normal restart."
    ],
    conditions: ["When the system starts a restart after Windows Update or a driver installation"],
    causes: ["A normal restart requested by the system"],
    checks: [
      "Compare with Windows Update and installation events and User32 1074 from the same time.",
      "If there is no Kernel-Power 41 after the restart, it was a normal restart."
    ],
    caution: ["It is an informational record and is not a problem by itself."],
    faqs: [
      ["The PC rebooted without me pressing anything — is it because of 577?", "577 is a record that the system prepared a reboot, so an automatic restart such as an update or an installation is the likely cause. Also check Windows Update events from the same time."],
      ["What if there is a 41 after the 577?", "It may mean that an abnormal shutdown actually happened after the restart was prepared. In that case, check the BugcheckCode of 41 and WHEA events together."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6005", "power-sleep-wake"]
  },
  "kernel-processor-power-55": {
    ko: "event-kernel-processor-power-55.html",
    source: "Kernel-Processor-Power", id: "55", area: "Power & shutdown",
    title: "Kernel-Processor-Power Event 55: Reading the Processor Power Management Record",
    desc: "An informational event recorded at boot for each logical processor, listing the power management capabilities the CPU reports: idle states, performance states, base frequency and maximum and minimum performance percentage.",
    lead: "Kernel-Processor-Power 55 is an informational event that records, at boot and for each logical processor, the idle states (C-states), the performance state method (such as CPPC), the base frequency and the maximum and minimum performance percentage. For example, a body starting with 'Processor 11 in group 0 exposes the following power management capabilities' is left once per processor.",
    body: [
      "Even if the count looks like several hundred, it is normal because it is the number of logical processors times the number of boots. CPU slowdown or overheating should be judged not from this event but from other IDs of the same provider and from temperature and clock records."
    ],
    conditions: ["At every boot, recorded all at once for as many logical processors as there are"],
    causes: ["A normal boot record — the count is the number of logical processors × the number of boots"],
    checks: [
      "Check that the count is not far from (number of logical processors × number of boots).",
      "If the number of idle states or the performance state method is not shown, check the CPU power management settings in the BIOS (C-state, CPPC).",
      "Check slowdown and overheating not with this event but with another ID of the same provider (for example 37) and temperature records."
    ],
    caution: ["It is not an error or a warning. Even if the count looks large, it is normal."],
    faqs: [
      ["There are several hundred 55 events — is that a problem?", "No. It is left as many times as the number of logical processors × the number of boots. For example, a PC with 24 logical processors booted 10 times gives 240 records."],
      ["Should I look at this event when CPU performance drops?", "This event only tells you which power management capabilities the CPU provides. For slowdown, check the temperature and power limit records in HWiNFO together with other events of Kernel-Processor-Power."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "user32-1074", "eventlog-6005", "power-sleep-wake"]
  },
  "power-sleep-wake": {
    ko: "event-power-sleep-wake.html",
    source: "Kernel-Power / Power-Troubleshooter", id: "42 · 1", area: "Power & shutdown",
    title: "PC Won't Wake From Sleep: Finding the Cause With Events 1 and 42",
    desc: "How to compare Power-Troubleshooter 1 and Kernel-Power 42 to tell what woke the PC from sleep and to separate sleep resume problems.",
    lead: "Kernel-Power 42 is the record of entering sleep, and Power-Troubleshooter 1 is the record that explains the cause of waking from sleep. Looking at the two events together lets you tell whether the PC woke by itself or whether a user operated it.",
    body: [
      "These two events are not codes that confirm a power problem right away. Only after you compare the sleep time in 42, the Wake Source in 1 and whether the mouse or keyboard was actually used can you check sleep settings or peripheral devices.",
      "Values to check in the records: in Kernel-Power 42, the time the PC entered sleep and the reason for sleep; in Power-Troubleshooter 1, the device or scheduled task shown as the Wake Source; and the repeat interval, to compare whether the same device wakes it every time or whether it repeats only at certain times."
    ],
    conditions: ["When the PC enters sleep", "When the PC wakes from sleep"],
    causes: ["A device or scheduled task shown as the Wake Source (the mouse, keyboard, network or a scheduled task)"],
    checks: [
      "Compare with actual use — compare the time you went to bed with the Wake Source of 1 and check whether it was a normal input.",
      "Check the powercfg results — in an administrator Command Prompt, run powercfg /lastwake and powercfg /waketimers to see the device that woke the PC most recently and the scheduled tasks. If a scheduled task is shown as the one that woke it, also check Sleep > Allow wake timers in the advanced power options. This setting decides whether a scheduled task can wake a sleeping PC, and the choices are \"Disable\", \"Enable\" and \"Important Wake Timers Only\". Before you change the value, take a photo of the current setting.",
      "Check device wake permissions — in Device Manager, check the power management tab of the network adapter, mouse and keyboard, and adjust the wake permission only when needed.",
      "Compare resume failures — if the screen stays black or the PC reboots, check Display, WHEA and Kernel-Power 41 from the same time together.",
      "Check the BIOS and drivers — if a sleep-related problem started after an update, compare the chipset, graphics and network drivers and the time of the BIOS change."
    ],
    caution: ["Do not conclude that the motherboard or power supply is faulty from event 1 or 42 alone. Separating the record of waking from sleep from the record of resume failure reduces unnecessary part replacement."],
    faqs: [
      ["If there is a Power-Troubleshooter 1, did the PC turn on by itself?", "1 is the event that records the cause of waking from sleep. The mouse, keyboard, network or a scheduled task can be the cause, so you need to check the value of Wake Source."],
      ["Does Kernel-Power 42 mean a power failure?", "42 is the record that Windows entered sleep. Do not conclude it is a power failure; compare the actual sleep and resume times and the events of peripheral devices together."]
    ],
    refs: [],
    related: ["kernel-power-41", "eventlog-6008", "eventlog-6005", "eventlog-6006", "eventlog-6013"]
  },
  "time-service-158": {
    ko: "event-time-service-158.html",
    source: "Time-Service", id: "158", area: "Network",
    title: "Time-Service Event 158: Reading the VMICTimeProvider Stopped Record",
    desc: "A record that the VMICTimeProvider time provider stopped because it does not support this hardware and operating environment. It is expected on a PC that is not a Hyper-V guest.",
    lead: "Time-Service 158 is a record that VMICTimeProvider stopped, saying it does not support the current hardware and operating environment. This time provider is for Hyper-V virtual machines only, so on an ordinary PC (not a virtual machine) it stops as expected after boot and leaves this record. It does not end with one record; the same record can repeat several times at about 17-minute intervals. In a case where one PC was observed, a pattern of 5 records over about 70 minutes, starting about 2 minutes after boot, appeared at almost every boot; the count and interval can differ on other PCs.",
    body: [
      "The message includes an explanation to the effect that this behavior is expected in an environment that is not a Hyper-V guest, so even though it looks like a warning, no action is needed. Only when the time is actually drifting should you check the time service synchronization settings and the CMOS battery."
    ],
    conditions: ["Repeating for a while after boot (on a PC that is not a Hyper-V virtual machine)"],
    causes: ["A time provider meant only for virtual machines is stopped automatically on an ordinary PC"],
    checks: [
      "Check the name of the time provider (VMICTimeProvider).",
      "Check whether the time is actually drifting.",
      "Check time synchronization problems together with Time-Service 35 (synchronization start)."
    ],
    caution: ["It is normal for VMICTimeProvider to stop on a PC that is not a Hyper-V guest, so no action is needed."],
    faqs: [
      ["Time-Service 158 keeps repeating after boot — is time synchronization failing?", "No. It is a record that a provider meant for virtual machines stopped on an ordinary PC, and it is separate from internet time synchronization. Check synchronization with records such as Time-Service 35."],
      ["Is it different if I use Hyper-V?", "Inside a Hyper-V guest (a virtual machine) this provider works normally. On the host PC, it is normal for it to stop."]
    ],
    refs: [],
    related: ["time-service-134", "eventlog-6005", "eventlog-6013", "kernel-general-1"]
  }
};
