(() => {
  // English UI strings, shared glossary and site-tool links for the symptom self-check wizards (en/pc-*-check.html).
  // symptom-wizard.js reads window.ITSVC_WIZARD_UI and overrides its Korean defaults key by key.
  // English visitors are not shown the Korean-only services (KakaoTalk chat, on-site visit, remote check, price
  // page), so noContact is on and the last screen gives general advice instead.
  window.ITSVC_WIZARD_UI = {
    lang: "en",
    noContact: true,
    stages: ["Pick a symptom", "Questions", "Try it", "Result"],
    stagesLabel: "Progress",
    trailLabel: "Your choices so far",
    pickNo: "Pick a symptom",
    qNo: (n) => `Question ${n}`,
    linkSub: "Opens another self-check page",
    sumSymptom: "[Symptom]", sumResult: "[Result]", sumDid: "[What I tried]", sumNone: "(nothing yet)",
    sumHard: "[Step I found hard]", sumRest: "[Causes not yet checked]", sumFinal: "[Outcome] The problem is still there.",
    limitCause: "Causes that need the case opened or parts swapped (for example a faulty part)",
    causeTag: { cur: "Checking now", next: "Check next", lowered: "Less likely now" },
    causeHard: "Hard to check yourself",
    causesTitle: "Causes to check first",
    causesLeft: (n) => `${n} left`,
    causesHint: "Shown in order, starting with what is quickest and easiest to check.",
    causesNote: "This does not confirm a cause. A cause you tried without success is not ruled out completely; it is only marked \"Less likely now\".",
    termsTitle: (n) => `${n} unfamiliar ${n === 1 ? "term" : "terms"} explained`,
    toolboxLabel: "Make it easier with a tool on this site",
    toolboxNote: "It opens in a new tab, so your current step stays here.",
    lvLimit: "Professional help recommended",
    lvKey: { Easy: "쉬움", Moderate: "보통", Careful: "주의", "Professional help recommended": "방문 권장" },
    guidesTitle: "More detail in these guides",
    helpStuck: "Stuck while following along?",
    helpKakao: "",
    railLimit: "Hand-off step", railDone: "Tried, no change", railCur: "Current step", railPro: "Professional check",
    railNext: "Next step", railNextWith: (m) => `Next step · ${m}`,
    railAria: "Step list", railHead: "Progress",
    railNote: "If you get stuck, press \"I need help\" at any time to see what to do next.",
    resultNo: "Result",
    memAsk: "How many memory (RAM) sticks are installed?",
    memHint: "Inside the case you will see long thin sticks in the motherboard slots. The test method depends on how many there are. If you cannot open the case, choose the third answer.",
    memOpts: ["Two or more", "Only one", "I don't know / I can't open the case"],
    gpuAsk: "Does the CPU have built-in graphics?",
    gpuHint: "With built-in graphics you can remove the graphics card and test using the motherboard's video port. Without it, you need a spare graphics card to test with.",
    gpuHelpTitle: "How to check whether the CPU has built-in graphics",
    gpuHelpHtml: `<p><strong>If Windows starts</strong></p>
            <ul class="mini-list">
              <li>Task Manager (Ctrl+Shift+Esc) → Performance tab. If there are two or more "GPU" entries and one of them looks like Intel UHD, Intel Iris or AMD Radeon Graphics, the CPU has built-in graphics.</li>
              <li>Device Manager → Display adapters. See whether a built-in graphics name is listed. It may not appear if it is turned off in the BIOS.</li>
              <li>Settings > System > About: note the "Processor" model name, then look it up in the maker's specifications below.</li>
            </ul>
            <p><strong>Checking by CPU model name</strong></p>
            <ul class="mini-list">
              <li>Intel: a model name ending in F (for example 12400F or 13400KF) has no built-in graphics. You can also check the "Processor Graphics" item in Intel's official product specifications (ARK).</li>
              <li>AMD: check the "Graphics Model" item in AMD's official product specifications. If it says something like "Discrete Graphics Card Required", the model has no built-in graphics. It differs by model, so always look up the exact model name.</li>
            </ul>
            <p><strong>If Windows does not start</strong></p>
            <ul class="mini-list">
              <li>Find the CPU model name in your purchase record, the product box or the quotation, and look it up as above.</li>
              <li>The model name is also printed on the CPU itself, but you would have to remove the cooler to see it, so we do not recommend that.</li>
              <li>Look at the back of the PC for video ports such as HDMI or DisplayPort on the motherboard. With no such port you cannot use built-in graphics output. Even with the ports, a CPU model without built-in graphics gives no picture, so check the model name as well.</li>
            </ul>`,
    gpuOpts: ["It has built-in graphics", "It has no built-in graphics", "I don't know"],
    warnLead: "Do not do this yourself.",
    solvedAlt: "ITS Panda giving a thumbs up",
    solvedTitle: "Glad it's fixed",
    solvedText: (n) => `${n ? `You solved it after trying ${n} ${n === 1 ? "step" : "steps"}. ` : ""}If the same symptom comes back, see the guides below. If it keeps coming back, it is worth checking the condition of the parts.`,
    contactDone: (n) => (n ? `You have tried ${n} ${n === 1 ? "step" : "steps"}` : "You have not tried any steps yet"),
    contactTitle: "Time to hand this over to a professional",
    contactHard: "You do not have to push through a step that feels too hard. ",
    contactLead: "If you could not fix this yourself, do not keep going with risky steps. Contact the manufacturer's support, the shop where you bought the device, or a local repair technician, and show them the summary below.",
    contactRest: "Causes not yet checked",
    contactCopyHint: "Copy the summary below and give it to the person helping you, so they can see what you have already tried.",
    copyBtn: "Copy symptom summary", copied: "Copied.", copyFail: "Could not copy. Please select the text above and copy it yourself.",
    remoteBtn: "", kakaoBtn: "", pricingBtn: "",
    limitNo: "From here, a professional should take over", limitBtn: "What should I do next?", solvedBtn: "It's fixed",
    stepNo: (i, n) => `Step ${i} of ${n}`, doing: " · Follow along",
    spareTip: "Spare part tip",
    spareNote: "Use a part you know works for the test, and check first that it is the same type.",
    toolsLabel: "What you need", toolsNone: "You can do this without any tools or parts.",
    why: "Why check this?",
    askTools: "Do you have what you need, and do you want to try it yourself?", ask: "Do you want to try this step yourself?",
    yesTools: "I have it, let me try", yes: "Let me try",
    noTools: "I don't have it, what now?", hardBtn: "I need help, what now?",
    askFoot: "What you can try yourself, and the tools you have, differ from person to person. You do not have to push yourself. The time and difficulty shown are rough estimates based on the kind of task.",
    howTitle: "Follow along", howCount: (on, n) => `${on} / ${n} done`,
    askDone: "Did you try it?", sameBtn: "I tried it, no change", hardBtn2: "I need help",
    noteLabel: "Note", readLabel: "How to read the result",
    hardNoTools: (t, tools) => `${t} (no tools or parts: ${tools})`,
    hardDoing: (t) => `${t} (became too difficult)`,
    entryLabel: "Jumped in from a guide",
    iconRules: [
      ["desktop", "tower"], ["^laptop$", "laptop"],
      ["screen|monitor|display|graphics|refresh", "monitor"],
      ["sound|speaker|earphone|headphone|audio", "speaker"], ["microphone|\\bmic\\b", "mic"], ["webcam|camera", "camera"],
      ["keyboard|\\bkeys?\\b", "keyboard"], ["mouse|touchpad|trackpad", "pointer"], ["bluetooth", "bluetooth"],
      ["usb|external|front port", "usb"], ["hard drive|hard disk|\\bssd\\b|\\bhdd\\b|disk|drive|storage|\\bfiles?\\b|data", "drive"],
      ["wi-?fi|internet|network|website|server|sharing|connect", "wifi"],
      ["\\bfans?\\b|noise|whine", "fan"], ["hot|overheat|temperature", "thermo"], ["battery|charg", "battery"],
      ["slow|lag|frame|stutter|takes? (a )?long", "gauge"],
      ["can't (get into|enter) windows|boot|recovery", "loop"],
      ["power|turn(s)? on|won't start|shuts? off|restart|no response", "power"],
    ],
  };

  // Shared glossary: the first matches found in a step's text are shown under "unfamiliar terms explained".
  window.ITSVC_WIZARD_GLOSSARY = [
    { n: "PSU (power supply)", p: "\\bPSU\\b|power supply|PSU tester", d: "The part that distributes electricity to every component. It has the socket for the power cord at the back of the case." },
    { n: "Motherboard", p: "\\bmotherboard\\b", d: "The large circuit board that the CPU, memory, graphics card and every other part plug into." },
    { n: "BIOS", p: "\\bBIOS\\b", d: "The basic setup program that runs before Windows. You usually reach it by pressing Del or F2 repeatedly right after switching the PC on." },
    { n: "Driver", p: "\\bdrivers?\\b", d: "Software that lets Windows use a device." },
    { n: "Safe Mode", p: "Safe Mode", d: "A way to start Windows with only the essential functions. It helps you tell whether a problem comes from the programs you normally run." },
    { n: "Slot", p: "\\bslots?\\b", d: "A socket on the motherboard where you plug in memory or a graphics card." },
    { n: "SMART", p: "\\bSMART\\b", d: "Health information that a storage device records about itself." },
    { n: "File Explorer", p: "File Explorer|Windows Explorer", d: "The built-in Windows program that shows the desktop and your folders." },
    { n: "Drive letter", p: "drive letter", d: "The name a storage device gets, such as C: or D:." },
    { n: "Boot", p: "\\bboot(ing)?\\b", d: "The process from switching the PC on until Windows opens." },
  ];

  // Only tools that have an English page on this site are linked from the English wizards.
  window.ITSVC_WIZARD_TOOLS = {
    eventLog: { h: "/en/event-log-analyzer.html", t: "Open the event log analyzer", d: "Paste what you copied from Event Viewer and it explains it for you." },
    ssd: { h: "/en/ssd-health-check.html", t: "Open the SSD health check", d: "Paste or load your CrystalDiskInfo result and it tells you whether the drive may be about to fail." },
  };
})();
