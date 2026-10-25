// English editions, batch 3 (see event-en-content.mjs for the rules: faithful translation of
// the Korean page named in `ko`, no new technical claims).

const MS = "Microsoft Learn";

export const eventEn3 = {
  "disk-9": {
    ko: "event-disk-9.html",
    source: "Disk", id: "9", area: "Storage",
    title: "Disk Event 9: Controller Error",
    desc: "Disk 9 records that the disk driver detected a controller error on a \\Device\\Harddisk device. A connection problem and a hardware fault are both possible causes.",
    lead: "9 records that the disk driver detected a controller error on a \\Device\\Harddisk device. It comes from the same family as event 11, so first pin down which device number it repeats on.",
    body: [
      "If it appears only on devices that are connected often, such as an external drive or card reader, a cable, port or power-supply problem is likely. If it repeats on an internal drive, suspect the controller or the drive itself first."
    ],
    conditions: ["Delays while the disk is accessed", "Errors when an external drive is connected", "A device is not recognised in a RAID configuration"],
    causes: ["A loose USB or SATA connection", "Insufficient power supply", "A faulty storage controller or cable"],
    checks: [
      "Use the disk instance number to identify which device it is.",
      "Check the cable and the connection.",
      "Move the device to another port and see whether it still reproduces."
    ],
    caution: ["If it repeats, back up your data first."],
    faqs: [
      ["Does 9 mean the disk is about to fail?", "You cannot conclude that. It is often caused by a poor connection, so first change the cable or port and see whether it reproduces. If it still repeats, suspect the storage device itself."],
      ["Is it more serious when it appears together with event 11?", "Yes. If 9 and 11 repeat together on the same disk number, a real fault in the drive or controller is more likely than a simple connection problem, so back up your data first."]
    ],
    refs: [],
    related: ["disk-7", "disk-51", "disk-153", "ntfs-55"]
  },

  "disk-11": {
    ko: "event-disk-11.html",
    source: "Disk", id: "11", area: "Storage",
    title: "Disk Event 11: The Driver Detected a Controller Error",
    desc: "Disk 11 records that the disk controller detected an error on a disk device. Together with event 7 it should be read as a sign of a storage problem.",
    lead: "11 records that the disk controller detected an error on a disk device. It is classed as a clearer error signal than event 9; if it repeats on the same disk together with event 7, treat it as a storage problem.",
    body: [
      "If it repeats during boot or heavy disk work such as file copies, note the conditions under which it reproduces and check the SMART state with the manufacturer's diagnostic tool; that helps narrow the cause."
    ],
    conditions: ["Freezing during a file copy", "Delays when a particular drive is accessed", "A disk-recognition error during boot"],
    causes: ["A loose SATA cable or port", "A storage controller error", "An M.2 or SATA SSD firmware problem"],
    checks: [
      "Check the disk number shown in the error.",
      "Replace the SATA cable or change the port.",
      "Check the disk's health with the manufacturer's diagnostic tool."
    ],
    caution: ["If it repeats together with event 7, back up your data immediately."],
    faqs: [],
    refs: [],
    related: ["disk-7", "disk-51", "disk-153", "ntfs-55"]
  },

  "disk-15": {
    ko: "event-disk-15.html",
    source: "Disk", id: "15", area: "Storage",
    title: "Disk Event 15: Device Not Ready for Access",
    desc: "Disk 15 records that a storage device was not yet in a state where it could be accessed. It can be harmless, for example right after a virtual-machine snapshot; if it repeats on a physical disk, check the connection, controller and device response delay.",
    lead: "15 records that the specified disk device was not yet ready to be accessed. The first thing to compare is whether the time it appears coincides with a connection, a wake from sleep or a virtual-machine snapshot.",
    body: [
      "A VMware (Broadcom) knowledge-base article says this event can be recorded right after a quiesce snapshot of a virtual machine and can be ignored. On a physical PC, one or two records with no symptoms are something to watch; if freezes or file errors repeat alongside it, move on to checking the storage device."
    ],
    conditions: ["Right after connecting an external drive or USB storage, or waking from sleep", "Right after a virtual-machine (quiesce) snapshot", "Storage is recognised late during boot"],
    causes: ["An access request arrived while the device was still initialising", "A controller, driver or firmware problem", "An unstable cable, port or power supply", "A virtual-machine snapshot removed a temporary disk"],
    checks: [
      "Check which disk number it is and whether it is external or internal.",
      "Check whether the time coincides with a connection, a wake from sleep or a snapshot.",
      "Compare with Disk 7, 11, 51 and 153 records from the same time.",
      "Change the cable and port, and compare the USB selective suspend setting.",
      "If it repeats on an internal device, check SMART and the controller driver."
    ],
    caution: [
      "If it repeats together with disk access errors, back up before you check anything.",
      "Do not change the device timeout value without knowing the cause."
    ],
    faqs: [
      ["15 is recorded every time I plug in my external drive. Is that all right?", "It is common for an access request to arrive before the device is ready. If there are no real file-access errors, just observe; if there are, check the cable, the port and the USB power-saving setting."],
      ["It appears only in a virtual machine.", "VMware says it can be harmless right after a snapshot. If it repeats regardless of snapshots, or disk errors inside the guest appear with it, check the storage connection."]
    ],
    refs: [],
    related: ["disk-51", "ntfs-55", "disk-153", "disk-98", "ntfs-140"]
  },

  "disk-52": {
    ko: "event-disk-52.html",
    source: "Disk", id: "52", area: "Storage",
    title: "Disk Event 52: Storage Failure Prediction Warning",
    desc: "Disk 52 records that a storage device has reported that it is predicted to fail soon. The message itself tells you to back up immediately and consider replacing the drive.",
    lead: "52 records that the driver received information from the storage device predicting that it will fail soon. Unlike other storage events, the message itself recommends an immediate backup, so protect your data before analysing the cause.",
    body: [
      "The disk number is not the drive letter. Match the number in Disk Management or the manufacturer's tool to find out which drive it is. It is rare, but there are reports of the same warning being left by a cable or controller problem, so after the backup you can cross-check the connection."
    ],
    conditions: ["A SMART warning also appears in the BIOS or the manufacturer's tool", "Slowdowns, freezes and file-read errors occur together", "Other storage events such as Disk 7, 11, 51 and 153 follow"],
    causes: ["The storage device itself is deteriorating (growing reallocated sectors, media errors and so on)", "End of life of a long-used HDD", "There are cases where a cable or controller problem turned out to be the cause"],
    checks: [
      "Immediately back up important files to another storage device.",
      "Identify which drive the disk number in the event (\\Device\\HarddiskN\\DRN) refers to.",
      "Check SMART and the error count with the manufacturer's diagnostic tool.",
      "Change the cable and port and see whether the same warning continues.",
      "If the warning is confirmed, schedule a replacement and move your data to a new drive."
    ],
    caution: [
      "Before the backup is finished, do not run anything that loads the disk, such as chkdsk, defragmentation or a full scan.",
      "If this record has appeared even once, keep up your regular backups."
    ],
    faqs: [
      ["52 appeared once. Do I have to replace the drive right away?", "Back up first. Then check the SMART state with the manufacturer's diagnostic tool, and plan a replacement if the warning is confirmed or there are symptoms."],
      ["Is the same record left on an SSD?", "It can be, whatever the type of storage device, when the device reports failure-prediction information. First check which device the disk number in the event refers to."]
    ],
    refs: [],
    related: ["disk-7", "disk-51", "ntfs-55", "disk-153", "disk-98"]
  },

  "disk-154": {
    ko: "event-disk-154.html",
    source: "Disk", id: "154", area: "Storage",
    title: "Disk Event 154: Hardware I/O Error",
    desc: "Disk 154 records that an I/O operation at the disk layer failed because of a hardware error. On servers and FC storage it can also come from communication problems between adapter, controller and storage array; on an ordinary PC, check the disk, controller, cable, slot and firmware together.",
    lead: "Disk 154 records that a disk I/O operation failed because of a hardware error. On servers and FC storage it can also come from a communication problem between the adapter and the storage array; on an ordinary PC, look at the disk, controller, cable and slot as a single path.",
    body: [
      "If you double-click event 154 in Event Viewer, a properties window opens. It shows, in a sentence, that the source is disk and at which logical block address of which disk (PDO name) the error occurred.",
      "Even if files open and the PC seems normal again, repeated I/O errors can lead to data loss. Before any repair command, copy important files to another storage device first, and keep the disk number, LBA and port information from the event."
    ],
    conditions: ["Freezes or delays while copying or saving files", "Storage access errors during boot or while running programs", "Disk 7, 11, 51, 129, 153 or Ntfs events repeat at the same time"],
    causes: ["An I/O timeout of the storage device or controller", "A contact problem with the SATA cable, power or M.2 slot", "SSD/HDD firmware and chipset/storage driver problems", "Link, adapter or storage-array communication errors in server and FC environments"],
    checks: [
      "Back up important files to another storage device first.",
      "Record the disk number, LBA, port and error sentence from the event to identify the target device.",
      "Check health, temperature and media errors with SMART and the manufacturer's diagnostic tool.",
      "Check the SATA cable, power and M.2 seating, and cross-check with another port or slot.",
      "Group Disk, Ntfs, storahci and WHEA events by the same time and compare the conditions under which they repeat.",
      "In server or FC environments, also check the logs and firmware of the adapter, switch and storage vendor."
    ],
    caution: ["For a repeating 154, do not first run repair commands or change the disk timeout value in the registry. Data backup and checking the hardware path come first."],
    faqs: [],
    refs: [],
    related: ["disk-7", "disk-51", "disk-153", "ntfs-55", "storahci-129"]
  },

  "ntfs-50": {
    ko: "event-ntfs-50.html",
    source: "Ntfs", id: "50", area: "Storage",
    title: "Ntfs Event 50: Delayed Write Failed",
    desc: "Ntfs 50 shows that NTFS failed while trying to write data to a storage device: a delayed write failure, where a write is delayed and then fails.",
    lead: "50 is a “delayed write failed” record: NTFS tried to write data to a storage device and failed. Because the write request was delayed before it failed rather than failing at once, suspect connection stability or power-management settings first.",
    body: [
      "If it appears on an external drive, check the USB selective suspend setting related to power saving; on an internal storage device, check response timeouts and the SMART state together."
    ],
    conditions: ["An error message right after saving a file", "Data lost after an external drive was removed", "Writes during an unstable power supply"],
    causes: ["A response timeout of the storage device", "An unstable cable or connection", "The device going to sleep because of power management"],
    checks: [
      "Check the volume label and identify the target drive.",
      "Check the cable condition and power-management settings.",
      "Check the health state with SMART and the manufacturer's diagnostic tool."
    ],
    caution: ["A file may have been damaged by the failed write, so check the saved data."],
    sections: [
      ["Real user case: why a target of D:\\$Mft or \\$Directory has to be read differently", [
        "When the log of one PC was analysed, 12 Ntfs 50 records were found, but the target was not an ordinary document: it was D:\\$Mft (5 records) and \\$Directory (7 records). $Mft is the master file table that holds the location of every file on an NTFS volume, and $Directory is the index that holds the directory structure. Both are metadata that make up the file-system structure of the whole volume, not user files. A write failure there means that the whole volume, not one particular file, may be at risk.",
        "In the same period the same drive (SAMSUNG HD502HJ) showed Disk 51 1,930 times and storahci 129 (controller reset) 13 times, which confirmed a physical defect of the drive itself. The full story is in the Disk event 51 case.",
        "Key point: if the target of the delayed write failure is an NTFS metadata file whose name starts with $, such as $Mft, $Directory or $LogFile, it is a more urgent signal than the loss of an ordinary user file. The volume itself can become unmountable, so do not wait for the SMART result; back up immediately."
      ]]
    ],
    faqs: [],
    refs: [],
    related: ["ntfs-55", "disk-51", "disk-7", "ntfs-140"]
  },

  "ntfs-57": {
    ko: "event-ntfs-57.html",
    source: "Ntfs", id: "57", area: "Storage",
    title: "Ntfs Event 57: Metadata Write Failed",
    desc: "Ntfs 57 shows that writing NTFS file-system metadata failed. The integrity of the file-system structure itself is under threat.",
    lead: "57 records that writing the NTFS file-system metadata itself failed, which points to a more fundamental file-system integrity problem than event 50. If it repeats, put data backup first.",
    body: [
      "If it appears at the same time as event 55 (file-system corruption), the storage device may already be in considerably worse condition, so keep to the order of finishing a backup before running chkdsk."
    ],
    conditions: ["After an abnormal shutdown", "Write errors on an external drive", "When the storage device responds slowly"],
    causes: ["Poor storage-device response", "A cable or controller problem", "An unstable power supply"],
    checks: [
      "Back up your data as soon as it occurs.",
      "Check whether it appears together with event 55.",
      "Check SMART, then decide whether to replace the disk."
    ],
    caution: ["If this event repeats, seriously consider replacing the storage device."],
    faqs: [],
    refs: [],
    related: ["ntfs-55", "ntfs-140", "disk-7", "disk-51"]
  },

  "ntfs-137": {
    ko: "event-ntfs-137.html",
    source: "Ntfs", id: "137", area: "Storage",
    title: "Ntfs Event 137: Default Transaction Resource Manager Failed to Start",
    desc: "Ntfs 137 records that the default transaction resource manager of an NTFS volume failed to start with a non-retryable error. The event data holds an error code, so you have to separate volume corruption, a volume that cannot be written to and interaction with snapshots or backups.",
    lead: "137 records that NTFS could not start the default transaction resource manager of a volume. The message alone does not reveal the cause, so look at the error code in the event data together with the kind of volume.",
    body: [
      "Documents from backup and virtualisation vendors list cases where 50, 57, 137 and 140 are left together right after a snapshot or a backup. If file-system corruption records (55, 57, 140) are present at the same time, suspect the storage side first; if it coincides with the snapshot or backup time, suspect that first."
    ],
    conditions: ["Repeats on the same volume at boot and shutdown", "Right after a virtual-machine snapshot or a backup", "Occurs on special volumes such as a RAM disk or an external volume"],
    causes: ["File-system corruption of the volume or a storage-device error", "A read-only or non-writable state, or a special volume such as a RAM disk", "A backup or snapshot job temporarily blocked access to the volume"],
    checks: [
      "Record the volume name and the error code in the data from the event body.",
      "Compare with Ntfs 55, 57 and 140 and Disk 7, 11 and 153 records from the same time.",
      "Check whether the volume is a RAM disk, an external or a virtual disk.",
      "Check the result of chkdsk run without options (a read-only check).",
      "Compare the backup and snapshot schedule with the time it occurred."
    ],
    caution: [
      "If a storage-device error is suspected, back up before running chkdsk /f.",
      "If the volume is one with an obvious cause such as a RAM disk and there is no functional problem, it may be just something to observe."
    ],
    faqs: [
      ["137 appears at every boot. Is it dangerous?", "If it is left on the same volume every time and there are no file errors, a special volume such as a RAM disk may be the reason. If file-access errors or other storage-device records appear with it, move on to checking the storage device."],
      ["Can I run chkdsk right away?", "If a storage-device error is suspected, back up first. A check run without options is read-only and relatively safe, but the repair option (/f) can be a burden on a device in poor condition."]
    ],
    refs: [],
    related: ["ntfs-55", "ntfs-140", "disk-153", "disk-98", "disk-51"]
  },

  "whea-logger-17": {
    ko: "event-whea-logger-17.html",
    source: "WHEA-Logger", id: "17", area: "Hardware errors",
    title: "WHEA-Logger Event 17: Corrected PCIe Error",
    desc: "WHEA-Logger 17 records that a PCIe-class hardware error was corrected and the system kept running. It is not a failure right now, but if the count grows, suspect an unstable link at the graphics card or NVMe slot.",
    lead: "17 records that a PCIe-class hardware error occurred but was corrected on its own and the system kept running. Rather than being reassured that it was corrected, watch whether the count keeps growing.",
    body: [
      "Comparing whether temperature or load was unusually high when the record appeared gives a hint as to whether the cause is a cooling problem or ageing of the device itself."
    ],
    conditions: ["Under GPU or NVMe load", "After waking from sleep"],
    causes: ["An unstable PCIe link", "Device firmware or driver", "Overclocking or power management"],
    checks: [
      "Locate the device: compare the bus, device and function numbers in the record with Device Manager → device properties → Details → Location information to find out which slot the device is in. It is usually the graphics card or an NVMe drive.",
      "Check the physical seating: turn the power off and re-seat the device. For a graphics card check the slot latch and the auxiliary power; for NVMe check the screw and the slot insertion. An unstable PCIe link can also come from a contact problem.",
      "Update the BIOS and device firmware: bring the motherboard BIOS, chipset driver and NVMe firmware up to date. PCIe link stability is often improved by firmware fixes.",
      "Check whether it repeats at default clocks: if you set the PCIe speed manually or are overclocking, return to the defaults. If needed, lower the PCIe generation by one step in the BIOS (for example Gen4 → Gen3) and see whether it stabilises."
    ],
    caution: ["Even a corrected error needs checking if its count grows."],
    sections: [
      ["Corrected versus fatal errors", [
        "17 records that an error occurred in the PCIe path but was corrected and the system kept working. So it is not a failed state right now. However, repeated corrections are a sign that the link is unstable.",
        "Matching the bus, device and function numbers in the record (for example 0:1:0) with Device Manager → device properties → Details → Location information tells you which slot the device is in."
      ]],
      ["How to find which device the error came from", [
        "Note the Bus, Device and Function values in the event body. If the same record contains a device ID or vendor ID, write those down too.",
        "Press Windows logo key + X and open Device Manager. Double-click a PCIe-attached device such as the graphics card, an NVMe controller or a network adapter, choose Location information in the property list on the Details tab, and the PCI bus, device and function numbers appear.",
        "The event may show hexadecimal values (starting with 0x) while Device Manager shows decimal, so values of 10 or more may have to be converted before comparing."
      ]],
      ["Easy-to-reverse things to try against PCIe errors", [
        "Turn the power off completely, unplug the power cable and re-seat the graphics card and NVMe SSD, checking the contacts. If you use a riser or extension cable, take it out for a moment and compare with a direct connection.",
        "In the BIOS, lower the PCIe link speed by one step (for example Gen4 to Gen3). If the records disappear when lowered, a signal-quality problem in the slot, cable or riser becomes more likely.",
        "In the advanced settings of the Windows power options, set PCI Express → Link State Power Management to Off and compare whether the records decrease.",
        "Check that the motherboard BIOS and chipset driver are current, and if it started right after you updated the graphics driver, try going back to the previous version."
      ]],
      ["Field case: 17 repeated and led to 0x116 reboots", [
        "The following is a field case checked directly, not official documentation, and it does not mean that every similar symptom has the same cause. A PC with a graphics card rebooted several times over a few days, and each time 0x00000116 (VIDEO_TDR_FAILURE) was left. In Event Viewer, WHEA-Logger 17 repeated on the same PCIe port between the reboots, and before some reboots there was also an nvlddmkm 153 “BusReset TDR” record.",
        "In the sensor log the +12V, +3.3V and +5V voltages did not fluctuate and the GPU temperature was in the normal range, so the PCIe connection between the CPU and the graphics card was suspected rather than power or heat. In the two most recent cases checked in the field the same pattern was resolved after the motherboard was replaced, but not all parts had been cross-tested before the replacement.",
        "What made the distinction: voltage and temperature were normal, 17 repeated on the same port, and a GPU reset or 0x116 followed.",
        "What to check before replacing: re-seat the card, fix the PCIe generation and disable ASPM in the BIOS, use another slot, and put the card in another PC. If the same error appears with the card in another PC, the card is the problem."
      ]]
    ],
    faqs: [
      ["17 is said to be a corrected error. Can I ignore it?", "It means it was corrected and the system kept running, but if the count grows, a problem with a PCIe device or driver may be progressing, so keep watching."],
      ["Which should I check first, the GPU or the NVMe?", "Check the bus location (Bus) and device ID in the event details to find out which device it is associated with."]
    ],
    refs: [],
    related: ["whea-logger-18", "whea-logger-19", "whea-logger-20", "kernel-power-41", "nvlddmkm-153"]
  },

  "whea-logger-19": {
    ko: "event-whea-logger-19.html",
    source: "WHEA-Logger", id: "19", area: "Hardware errors",
    title: "WHEA-Logger Event 19: Corrected Hardware Error",
    desc: "WHEA-Logger 19 reports a corrected hardware error in the CPU, memory or PCIe. One or two have little meaning, but if they repeat in a short period they can be a sign before it worsens into WHEA-Logger 18 (fatal error).",
    lead: "19 records that a corrected hardware error was reported for the CPU, memory or PCIe state. It can be a sign before it worsens into WHEA 18 (an uncorrectable, fatal error), so watch the repeating pattern.",
    body: [
      "If it keeps repeating even after you return to the default settings, leave open the possibility that it is not overclocking or a settings problem but the limit of a component itself, and plan cross-testing."
    ],
    conditions: ["During a change of load", "After waking from sleep"],
    causes: ["Temporary voltage or clock instability", "BIOS settings", "A device link error"],
    checks: [
      "Check the error component: see which of CPU, memory and PCIe the record points to. The parts to check afterwards depend entirely on this value.",
      "Count the frequency: filter by this ID in Event Viewer and record the daily and weekly counts. It becomes the yardstick for judging improvement after a settings change.",
      "Reproduce at BIOS defaults: use Load Optimized Defaults to revert overclocking and XMP/EXPO at once and use the PC for a few days. Corrected errors often turn out to be a settings-stability problem.",
      "Record temperature and voltage: log temperature and voltage fluctuation under load with HWiNFO or similar. If it occurs only in a particular load range, check cooling or the power supply."
    ],
    caution: ["The repeating pattern matters more than a single occurrence."],
    sections: [
      ["The frequency is the yardstick", [
        "19 is also a corrected hardware error. One or two may mean little, but if they repeat in a short period it means the component or setting is running at its limit.",
        "If you filter by this ID in Event Viewer and count occurrences per day and per week, you can compare objectively whether things improved after a settings change."
      ]],
      ["How to record the count", [
        "In the System log of Event Viewer, filter the event source to WHEA-Logger and the event ID to 19, and note the count per date over a week.",
        "In PowerShell, running Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-WHEA-Logger'; Id=19} | Group-Object { $_.TimeCreated.Date } | Select-Object Name, Count shows the count per date at once.",
        "Comparing the weekly counts before and after you revert overclocking or undervolting makes it easier to judge whether the settings were the cause."
      ]],
      ["What a corrected error does and does not tell you", [
        "Corrected means the hardware recovered by itself. A record that appears once or twice, rarely, does not by itself mean a failure.",
        "However, compare in time order whether WHEA 18 or blue screen 0x124 occurred around the same time. If 19 grew gradually and then 18 appeared, it may be the same cause getting worse.",
        "If the count does not fall even after you return to the defaults, check the motherboard maker's BIOS update notes for stability or compatibility improvements."
      ]]
    ],
    faqs: [
      ["What is the difference between 19 and 18?", "18 is a fatal error that cannot be corrected, and 19 is an error that was corrected so the system kept running. If 19 repeats and grows, it can be seen as a sign before it worsens into 18."],
      ["Is it all right if it appears only after waking from sleep?", "It may be a temporary phenomenon in the voltage transitions related to sleep, but if it repeats, check the power-management settings in the BIOS."]
    ],
    refs: [],
    related: ["whea-logger-18", "whea-logger-17", "whea-logger-20", "whea-logger-46", "kernel-power-41"]
  },

  "whea-logger-20": {
    ko: "event-whea-logger-20.html",
    source: "WHEA-Logger", id: "20", area: "Hardware errors",
    title: "WHEA-Logger Event 20: Fatal Hardware Error",
    desc: "WHEA-Logger 20 is an uncorrected, fatal hardware error that usually appears with a blue screen or forced reboot. Secure a backup before you narrow it down to CPU, memory or PCIe using the component in the error record.",
    lead: "20 records that a fatal hardware error was reported. Check the component shown in the error record to narrow down which of the CPU, memory and PCIe devices it relates to.",
    body: [
      "Even though it is classed as fatal, if the system has booted normally several more times, it is better to record the conditions under which it reproduces first than to replace parts right away."
    ],
    conditions: ["Right before a blue screen or reboot"],
    causes: ["A CPU, memory or PCIe device error", "Power or thermal instability"],
    checks: [
      "Back up important files first: a fatal hardware error has been confirmed, and the checks themselves can make things worse, so secure a backup to another physical storage device first.",
      "Check the part in the error record: see which of CPU, memory and PCIe the component entry in the record points to. Also check 6008 or BugCheck 1001 from the same time.",
      "Return to the default settings: in the BIOS turn off overclocking, XMP and undervolting, and see whether it reproduces at defaults. This step separates a settings problem from a real fault.",
      "Cross-test by part: if it still repeats at default settings, test the memory modules one at a time, and switch the graphics card to another slot or to the onboard output. If it reproduces only with a particular part, that part is the cause."
    ],
    caution: ["If it repeats, use the PC less and test the suspected parts separately."],
    sections: [
      ["20 is a record that needs an immediate response", [
        "20 is a fatal hardware error that could not be corrected, and it usually appears with a blue screen or a forced reboot. If 17 and 19 are warning signs, 20 means the system has actually stopped.",
        "Back up first. Once a hardware error is confirmed, the checking process can make the state worse. Move important files to another physical storage device before you go on."
      ]],
      ["The order right after a fatal error is recorded", [
        "Save the files you were working on and back up important data to another storage device.",
        "Write down what you changed recently, with dates. Driver updates, BIOS changes, added parts and overclock settings are the candidates.",
        "From the event body, check the component and the error source it reports, and tell whether it is of the CPU family or the PCIe device family.",
        "Remove PCIe expansion cards other than the graphics card (capture card, extra NVMe, wireless LAN card) one by one and compare whether it reproduces under the same conditions.",
        "If it still repeats, reset the BIOS settings, set again only the items that are really needed, and watch whether it repeats."
      ]],
      ["Reading 18 and 20 together", [
        "Both are classed as uncorrectable, fatal errors. If they were recorded consecutively, treat them as one failure sequence and line the times up with the Kernel-Power 41 and blue screen 0x124 records.",
        "Write down whether the component reported in each record is always the same. If the same device is named repeatedly, look at that device; if it differs every time, it is right to consider a common cause such as the power supply or the motherboard as well.",
        "Also read how to interpret the body entries in the WHEA 18 guide."
      ]]
    ],
    faqs: [
      ["Does it become a blue screen as soon as 20 appears?", "Not always, but because it is classed as fatal, it is often recorded just before or just after a blue screen."],
      ["Where do I check the component of the error record?", "Choose XML View on the Details tab in Event Viewer to see the affected hardware component information."]
    ],
    refs: [],
    related: ["whea-logger-18", "whea-logger-19", "whea-logger-17", "kernel-power-41", "eventlog-6008", "bugcheck-1001"]
  },

  "whea-logger-46": {
    ko: "event-whea-logger-46.html",
    source: "WHEA-Logger", id: "46", area: "Hardware errors",
    title: "WHEA-Logger Event 46: Memory Hierarchy Error",
    desc: "WHEA-Logger 46 is a fatal hardware error in the memory hierarchy. The cause can be not only the RAM module but also the CPU memory controller or board contact, so if it reproduces after replacing the module, suspect the controller side.",
    lead: "46 is a record that can appear as a fatal hardware error that includes the memory hierarchy. Besides the RAM itself, the memory controller, the XMP/EXPO settings and board contact problems can also be the cause.",
    body: [
      "If you fit the memory modules one at a time and swap slots while testing, you can fairly quickly tell whether the module is bad or whether a particular slot has a contact problem."
    ],
    conditions: ["Under memory load", "During boot or waking from sleep"],
    causes: ["RAM or memory-controller instability", "XMP/EXPO settings", "A board or CPU contact problem"],
    checks: [
      "Back up important data: a memory-hierarchy error can lead to data corruption. Secure a backup before you take action.",
      "Return the memory to its default speed: turn off XMP/EXPO in the BIOS and use the PC at the default speed (JEDEC) for a few days. If it disappears at this step, it is a profile-stability problem, not a bad module.",
      "Cross-test modules and slots: fit only one module at a time and see whether it reproduces, and also put the same module in another slot. This is how you separate a bad module from a bad slot.",
      "Consider the memory controller too: if it reproduces even after changing all the modules, it can be a problem with the memory controller inside the CPU or the socket contact. It can also occur when the CPU cooler mounting pressure is uneven, so consider re-seating it."
    ],
    caution: ["If the error repeats, do not treat the system as normal on the strength of a memory test result alone."],
    sections: [
      ["What it means that the memory hierarchy is named", [
        "46 is the case where the memory hierarchy was reported as the location of the error. The memory hierarchy here includes not only the RAM modules but also the memory controller and caches inside the CPU.",
        "So if it reproduces even after replacing the memory, keep in mind that it may be a problem on the controller side, that is, CPU or motherboard contact."
      ]],
      ["Additional steps when you suspect the memory", [
        "In the BIOS, turn off XMP or EXPO, go back to the default speed, and compare whether the same record is left.",
        "Try fitting only one module at a time, and when you use two, check that they are in the slots the motherboard manual recommends (usually A2 and B2). Swap modules and slots alternately and see whether the error follows the module or the slot.",
        "Do not judge it normal from a single Windows Memory Diagnostic run. Intermittent errors are caught only by running a tool such as MemTest86 booted from USB for many passes over a long time.",
        "Check whether the modules you use are in the motherboard maker's memory compatibility list (QVL).",
        "Check that you have not raised the BIOS voltages related to the memory controller above the automatic values."
      ]],
      ["Records that strengthen the memory suspicion when seen with 46", [
        "Blue screen 0x1A (MEMORY_MANAGEMENT) or 0x50 was left around the same time.",
        "It was recorded at the same time as Kernel-Power 41 and led to an unexpected reboot.",
        "It is recorded only with XMP or EXPO on and disappears at the default speed. In that case a settings-combination problem is more likely than a bad module.",
        "For the detailed test method, see the memory test guide."
      ]]
    ],
    faqs: [
      ["Is 46 an error related only to memory?", "It may include the memory hierarchy (Cache Hierarchy), but it can also appear because of a CPU cache problem, so you cannot conclude that it is a memory-only problem."],
      ["What should I do if it happens even after I turned XMP off?", "If it repeats at the default speed too, leave open the possibility that the module or slot itself, or the CPU's memory controller, is the problem, and cross-test the parts."]
    ],
    refs: [],
    related: ["whea-logger-20", "whea-logger-47", "whea-logger-17", "whea-logger-18", "whea-logger-19", "kernel-power-41"]
  },

  "whea-logger-47": {
    ko: "event-whea-logger-47.html",
    source: "WHEA-Logger", id: "47", area: "Hardware errors",
    title: "WHEA-Logger Event 47: Corrected Memory Error",
    desc: "WHEA-Logger 47 records a corrected hardware error. When the error component is shown as memory, check the RAM, the memory controller and the memory settings first.",
    lead: "WHEA-Logger 47 records that a corrected hardware error occurred. If Component is shown as Memory in the event details, check not only the RAM itself but also the memory controller, XMP/EXPO, BIOS compatibility and slot contact.",
    body: [
      "Because it is a corrected error it may not lead to a failure at once, but if it repeats in a short time or is accompanied by reboots or blue screens, it can be a sign that stability is breaking down. Start with the default memory settings and cross-testing by module."
    ],
    conditions: ["Repeats under load or at idle", "Before and after an unexpected reboot", "Component in the event XML is shown as Memory"],
    causes: ["RAM module instability or poor contact", "XMP/EXPO and memory overclock settings", "CPU memory controller or BIOS compatibility", "A motherboard slot or power-stability problem"],
    checks: [
      "Record the error count, Component, ErrorSource and PhysicalAddress from the XML.",
      "Turn off XMP/EXPO and overclocking and see whether it reproduces at the default memory speed.",
      "Test the RAM modules one at a time in the same slot, then change slots and cross-test.",
      "Run MemTest86+ or Windows Memory Diagnostic and compare the time with WHEA 19, 46 and Kernel-Power 41.",
      "If it repeats, back up important files and check BIOS and chipset updates and the memory compatibility list."
    ],
    caution: [
      "Do not ignore it just because it is a corrected error. If it repeats in a short time or is accompanied by reboots or blue screens, it can be a sign of hardware instability.",
      "Do not conclude from WHEA 47 alone that a particular RAM module or the CPU is at fault; test the modules, slots and default settings separately."
    ],
    sections: [
      ["How often does a corrected memory error become a problem?", [
        "On workstations and servers that use ECC memory, corrected memory errors being recorded is part of normal operation. What to look at then is not a single record but whether it keeps increasing on the same module.",
        "On an ordinary desktop such records should be rare. If several are left on the same day, it may be a sign that the memory speed or voltage settings are unstable.",
        "If you filter WHEA-Logger 47 in Event Viewer and note the count per date every week, you can tell whether it is a rising trend."
      ]],
      ["Checking whether settings can reduce it", [
        "Turn off XMP or EXPO and compare at the default speed for about a week.",
        "If it still repeats, lower the memory speed by one step, or bring the motherboard BIOS up to date and check whether memory compatibility was improved.",
        "If the record is always connected with the same slot or the same module, move that module to another slot, and if the error follows the module, consider replacing it.",
        "Follow the order in the memory test guide for the test."
      ]]
    ],
    faqs: [
      ["Does 47 mean the RAM is bad?", "No. The RAM, the CPU memory controller, XMP/EXPO, the BIOS and slot contact are all candidates. You have to test modules and slots separately."],
      ["It is a corrected error. Can I ignore it?", "A single record can be observed, but if the count grows or reboots or blue screens occur with it, back up and then check the default memory settings and diagnostic tools."]
    ],
    refs: [],
    related: ["whea-logger-46", "whea-logger-17", "whea-logger-18", "whea-logger-19", "whea-logger-20", "kernel-power-41"]
  },

  "stornvme-11": {
    ko: "event-stornvme-11.html",
    source: "stornvme", id: "11", area: "Storage",
    title: "stornvme Event 11: NVMe Controller Error",
    desc: "stornvme 11 records that an error was detected on an NVMe controller. It is reported to be left even when SMART is normal; the yardstick is whether it appears together with a device reset (129) or I/O delays.",
    lead: "11 records that the driver detected an error on the NVMe controller. The message is similar to Disk 11, but because the source is stornvme, read it separately as a record that came from the NVMe SSD path.",
    body: [
      "Official documentation does not list a single cause for this event. In user reports there are cases where adjusting firmware, BIOS or PCIe power management reduced it, and cases where it did not. If it is left only now and then with no symptoms, observe it; act when it repeats together with freezes or slowdowns."
    ],
    conditions: ["Repeats right after boot or restart", "Freezing during games or large copies", "stornvme 129 records are present with it"],
    causes: ["SSD firmware, NVMe driver or BIOS version problems", "A conflict with the PCIe link speed or power-management settings", "The controller failed to respond to a special command sent by a backup or disk utility", "M.2 slot contact or heat"],
    checks: [
      "Check the firmware version and SMART state with the SSD maker's tool.",
      "Check whether BIOS and chipset driver updates are available.",
      "Compare with stornvme 129 and Disk 153 records from the same time.",
      "Check whether you recently installed a disk utility or backup program.",
      "Try adjusting the PCIe link speed or the SSD power-saving feature only when the maker gives guidance."
    ],
    caution: [
      "If freezes repeat along with the error, back up before you change settings.",
      "Do not ignore the record just because SMART is normal; keep checking how often it repeats."
    ],
    faqs: [
      ["Are stornvme 11 and Disk 11 the same event?", "The messages are similar, but the source differs. Disk 11 is a record left by the disk driver and stornvme 11 by the NVMe driver, so check the source first."],
      ["SMART is normal but it keeps appearing. What should I do?", "SMART does not show every problem. Compare firmware, BIOS and chipset driver updates and the power-management settings, and if there are freezes, note whether it repeats together with 129."]
    ],
    refs: [],
    related: ["storahci-129", "disk-153", "disk-51", "ntfs-55", "disk-98"]
  },

  "stornvme-129": {
    ko: "event-stornvme-129.html",
    source: "stornvme", id: "129", area: "Storage",
    title: "stornvme Event 129: NVMe Device Reset",
    desc: "stornvme 129 records that a request sent to an NVMe storage device did not finish within the time limit and Windows reset the device path. The RaidPort number in the message is a storage port number, not a disk number.",
    lead: "129 records that a request Storport sent to a storage device did not finish within the time limit and the path was reset. Microsoft's troubleshooting guidance also describes 129 as a timeout of a disk request, and the cause is not fixed to one SSD.",
    body: [
      "storahci 129 means the same kind of reset happened on a SATA device, and stornvme 129 on an NVMe device. One or two may be a temporary delay; if it repeats together with freezes, compare the device, driver and power settings in that order."
    ],
    conditions: ["A momentary freeze that releases during games, file copies or boot", "Slow response for a while right after waking from sleep", "stornvme 11 or Disk 153 and Ntfs records are left together at the same time"],
    causes: ["SSD firmware or NVMe/chipset driver problems", "Compatibility between the PCIe link state/power-management (sleep) settings and the SSD", "Response delay caused by poor M.2 slot contact or overheating", "A response delay or declining lifetime of the SSD itself"],
    checks: [
      "Back up important files to another storage device first.",
      "Check the SSD state (SMART), temperature and firmware version with the maker's diagnostic tool.",
      "Compare whether stornvme 11, Disk 153 and Ntfs events are present at the same time.",
      "Check whether motherboard BIOS and chipset/NVMe driver updates are available.",
      "Change the power-management option to high performance and compare whether it reproduces."
    ],
    caution: [
      "Do not change the disk timeout (TimeOutValue) in the registry arbitrarily. Changing it without the maker's guidance can hide the cause.",
      "If freezes repeat, backup comes before checking."
    ],
    faqs: [
      ["Does 129 mean the SSD has failed?", "You cannot conclude that. Firmware, drivers, PCIe power management and heat can leave the same record. Judge it together with how often it repeats, the SMART state and stornvme 11 and Disk 153 records from the same time."],
      ["Does RaidPort0 mean I am using RAID?", "No. NVMe SSDs are also recorded under the same storage port name, and the number is a port number, not a disk number. Check which device it is from other records at the same time or the SSD maker's tool."]
    ],
    refs: [
      ["https://learn.microsoft.com/en-us/archive/blogs/ntdebugging/understanding-storage-timeouts-and-event-129-errors", `${MS}: Understanding Storage Timeouts and Event 129 Errors (NTDebugging blog archive)`],
      ["https://learn.microsoft.com/en-us/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors", `${MS}: Guidance for Troubleshooting Data Corruption and Disk Errors`]
    ],
    related: ["storahci-129", "stornvme-11", "disk-153", "ntfs-55", "disk-51"]
  },

  "volmgr-161": {
    ko: "event-volmgr-161.html",
    source: "Volmgr", id: "161", area: "Crashes & reports",
    title: "Volmgr Event 161: Crash Dump Could Not Be Saved",
    desc: "Volmgr 161 records that saving a crash dump after a blue screen or system halt failed. It often shows why the dump needed for failure analysis was not left, rather than being the cause itself.",
    lead: "161 records that saving a crash dump after a blue screen or system halt failed. More often than not it explains why no dump was left for analysis, rather than being the cause of the halt.",
    body: [
      "If no dump is left, there is nothing for a minidump analyser to read, so first check the page-file settings and the free space on the system drive. Viewing it together with BugCheck 1001, Kernel-Power 41 and WHEA records from the same time shows the flow."
    ],
    conditions: ["No minidump is created after a blue screen", "Recorded just before Kernel-Power 41", "A message saying dump-file creation failed is shown"],
    causes: ["The page file is missing or is not large enough to save a dump", "Not enough free space on the system drive where the dump is saved", "A storage-device error or failed access to the boot disk", "The dump write did not finish because of an unexpected power cut"],
    checks: [
      "Check whether C:\\Windows\\Minidump and C:\\Windows\\MEMORY.DMP were created.",
      "In System Properties → Startup and Recovery, check the debugging-information setting and the page-file setting.",
      "Compare the free space on the system drive with Disk, Ntfs and storport events.",
      "Check BugCheck 1001, Kernel-Power 41 and WHEA records from the same time.",
      "If a dump was created, check the faulting driver separately with a minidump analyser."
    ],
    caution: [
      "Do not conclude from 161 alone that the GPU, PSU or storage device has failed. Separate the failure to create a dump from the real cause of the halt.",
      "If storage-device errors are present too, back up important files before changing the dump settings."
    ],
    faqs: [
      ["If 161 is present, has the SSD failed?", "You cannot conclude that. It is left when the page file is missing or short of space, and also when the power is suddenly cut and the write does not finish. Check whether storage-device events (Disk, Ntfs) are present with it."],
      ["What should I check to get a dump left?", "Check the debugging-information setting and the page-file setting in System Properties → Startup and Recovery, and free up space on the system drive."]
    ],
    refs: [],
    related: ["bugcheck-1001", "kernel-power-41", "eventlog-6008", "whea-logger-18"]
  }
};
