(() => {
  // English edition of the internet and network self-check (wizard-network.js). Behavior lives in symptom-wizard.js,
  // screen text in wizard-ui-en.js. A faithful translation of the Korean wizard: no new claims. Windows menu names and
  // command messages are the English Windows 11 ones. As in the Korean edition, the commands (ipconfig, netsh) were
  // not run on a real Windows PC in this environment. Korean-only parts are adapted: Korean carrier names become
  // "your internet provider", and the step bullet that points to this site's Korean game status widget is left out.
  const LIMIT = (text) => ({ limit: true, t: text });

  const S = {
    restartRouter: {
      t: "Restart the modem and router",
      tools: [],
      how: [
        "Unplug the power adapters of the router and the modem (if you have one) from the wall outlet. Unplugging the adapter is more reliable than pressing a power button. The PC will lose the internet for a while.",
        "Wait 30 seconds to 1 minute. This gives the internal electricity time to drain completely.",
        "If you have a separate modem, plug in the modem first and wait 1 to 2 minutes until its lights (power and internet) settle. Then plug in the router.",
        "The router also takes 1 to 2 minutes to boot. After its lights (power and internet) are on normally, try the connection again from the PC.",
        "Remember the state of the modem and router lights (whether the internet light is off or red, or blinking). It helps a great deal when you ask for help.",
      ],
    },
    cables: {
      t: "Check the network cable and ports",
      tools: ["Another network cable (if you have one)"],
      spare: "If you have a spare network cable that you know works (a used one is fine), swapping it in to test is recommended.",
      how: [
        "Check that the network cable between the modem, the router and the PC is plugged in at both ends. When it is pushed in all the way, it gives a \"click\".",
        "Check that the cable is not bent sharply and that the latch on the connector is not broken. If the latch is broken, the plug can work loose.",
        "If you have another network cable, swap it in. Also try a different LAN port on the router (do not plug into the WAN/internet port).",
        "Connect another device (such as a laptop) to the same cable and port and see whether that device works. If it works on the other device, the problem is on the PC side (the LAN port or settings).",
        "Also look at the small light next to the port (the link light) to see whether it is on or blinking. If there is no light at all, there is no connection.",
      ],
    },
    otherNet: {
      t: "Check whether it behaves the same on another network (a phone hotspot)",
      tools: ["A phone that can turn on tethering"],
      how: [
        "Turn on the mobile hotspot (tethering) on your phone. This step uses your phone data, so check your plan.",
        "In the PC's Wi-Fi list, select the phone hotspot name, enter the password and connect.",
        "Check whether the internet works on the same site or game.",
        "If it works on the hotspot but only fails on your home router, the router or the line is the likely cause; if it fails on the hotspot too, the PC is the likely cause.",
        "After the test, turn the hotspot off and reconnect to your usual Wi-Fi.",
      ],
    },
    adapterDriver: {
      t: "Check and reinstall the network adapter driver",
      tools: [],
      how: [
        "Right-click the Start button and open \"Device Manager\".",
        "Click \"Network adapters\" to expand it. You should see a Wi-Fi adapter (a name containing Wireless, Wi-Fi and so on) and an Ethernet adapter (Ethernet, Gigabit and so on).",
        "It is a problem if an adapter has a yellow exclamation mark or if no adapter is listed at all.",
        "Right-click the adapter, choose \"Uninstall device\" and confirm. In most cases it is installed again automatically after a restart.",
        "If it is not installed automatically, download the network driver from the support page of the PC, motherboard or laptop maker. Since the internet does not work, download it on another device and move it over by USB.",
        "After installing, restart and check the connection.",
      ],
    },
    ipRenew: {
      t: "Renew the IP address and clear the DNS cache",
      tools: [],
      how: [
        "Type \"cmd\" in the taskbar search. Right-click the \"Command Prompt\" result, choose \"Run as administrator\" and click \"Yes\".",
        "In the black window, type ipconfig /release and press Enter. It is normal for the internet to drop at this moment.",
        "Next, type ipconfig /renew and press Enter. If a new IP address is shown, it worked. It may take a few seconds.",
        "If the internet still does not work, type ipconfig /flushdns and press Enter. It says \"Successfully flushed the DNS Resolver Cache.\"",
        "Restart the PC so the changes take effect, and check whether the internet works.",
      ],
    },
    flushDns: {
      t: "Clear the DNS cache",
      tools: [],
      how: [
        "Type \"cmd\" in the taskbar search. Right-click the \"Command Prompt\" result, choose \"Run as administrator\" and click \"Yes\".",
        "In the black window, type ipconfig /flushdns and press Enter.",
        "If the message \"Successfully flushed the DNS Resolver Cache.\" appears, it worked.",
        "Close the browser completely, open it again and try the same site.",
      ],
    },
    vpnSecurity: {
      t: "Turn off the VPN and security software briefly and check",
      tools: [],
      how: [
        "Open your VPN program (if you use one) and disconnect it. Also check the hidden icons at the right of the taskbar.",
        "If your antivirus or firewall has a web protection or firewall feature, turn it off briefly and try to connect. Keep the time it is off to a minimum.",
        "Test with the same site to see whether you can connect.",
        "When the test is over, be sure to turn the security software back on.",
        "If the symptom disappears once it is off, that program's settings (the exception list, web protection) are the cause.",
      ],
    },
    otherDevice: {
      t: "Check whether it behaves the same on another device (a phone or another PC)",
      tools: ["A phone or another PC"],
      how: [
        "On a phone connected to the same router by Wi-Fi, check whether the same site or service works.",
        "Also try opening the same site on the phone's mobile data (LTE or 5G). Turn Wi-Fi off for this test.",
        "If you have another PC or laptop, test it the same way.",
        "If it works on other devices and fails only on this PC, it is a PC settings problem; if it fails on every device, it is a problem with the site, the router or the line.",
        "Note on which devices it worked and on which it did not.",
      ],
    },
  };

  const NODES = {
    start: {
      q: "What is the problem?",
      hint: "Pick the one symptom that is closest.",
      options: [
        { t: "The internet does not work at all", icon: "globe", next: "netq" },
        { t: "Wi-Fi keeps dropping or the signal is weak", icon: "wifi", next: "r_wifidrop" },
        { t: "The internet works but only certain sites won't open", icon: "link", next: "r_site" },
        { t: "The browser shows \"refused to connect\" (ERR_CONNECTION_REFUSED)", icon: "block", next: "r_refused" },
        { t: "The internet stopped working after a Windows update", icon: "loop", next: "r_updbroken" },
        { t: "I can't connect to a game server, or it keeps disconnecting", icon: "gamepad", next: "r_game" },
        { t: "The printer shows offline or won't print", icon: "plug", next: "r_printer" },
        { t: "Remote Desktop (remote access) won't connect", icon: "monitor", next: "r_rdp" },
        { t: "A shared folder or network drive won't open", icon: "folder", next: "r_netdrive" },
      ],
    },
    r_printer: {
      mode: "remote",
      title: "For an offline printer, work through the spooler, connection and port in that order",
      lead: "When the printer is fine but shows offline on the computer, it is often because the print spooler stopped, the connection dropped, or the saved port (IP) no longer matches the real one.",
      steps: [
        {
          t: "Check the printer's power and connection, and switch it off and on",
          tools: [],
          how: [
            "Check that the printer is on and not in sleep mode. If the display is dark, press a button once to wake it.",
            "Switch the printer off, wait about 10 seconds and switch it on again.",
            "For a network (Wi-Fi) printer, check on the printer's display that the Wi-Fi name it is connected to is the same as the PC's.",
            "For a printer connected directly by USB, plug it into another USB port (the back of the PC if possible), without going through a hub.",
            "After the printer finishes starting up, see whether its status on the PC changes to \"Ready\".",
          ],
        },
        {
          t: "Restart the Print Spooler service",
          tools: [],
          how: [
            "Press Win+R on the keyboard, type services.msc and click OK.",
            "Find \"Print Spooler\" in the service list. If the list is long, press P to jump near it.",
            "Right-click it and choose \"Restart\". If it is stopped, choose \"Start\".",
            "If jobs are piled up in the print queue, cancel a few and print again.",
            "If restarting fixes it but it keeps coming back, you can set the service to restart itself on failure on the \"Recovery\" tab of its properties.",
          ],
        },
        {
          t: "Clear \"Use Printer Offline\" and set it as the default printer again",
          tools: [],
          how: [
            "Open Settings (Win+I) > Bluetooth & devices > Printers & scanners.",
            "Click the printer in question and choose \"Open print queue\".",
            "On the \"Printer\" menu at the top, if \"Use Printer Offline\" is checked, clear it.",
            "On the same screen, \"Set as default\" for that printer.",
            "Print a test page and see whether the status changes to \"Ready\".",
          ],
        },
        {
          t: "Use ping to separate the network part from the port and spooler part",
          tools: [],
          how: [
            "Find the printer's current IP address from the printer's menu or by printing a configuration page.",
            "Type cmd in the Start menu search to open Command Prompt.",
            "Type ping PrinterIP and press Enter (for example ping 192.168.0.20).",
            "If replies come back but it is still offline, the network is fine and the problem is in the port settings or the spooler.",
            "If you get \"Request timed out\", the connection between the PC and the printer is broken, so fix the Wi-Fi connection and IP before touching the port.",
          ],
        },
        {
          t: "Change a WSD port to a standard TCP/IP port",
          tools: [],
          how: [
            "Open Settings > Bluetooth & devices > Printers & scanners, click the printer and open \"Printer properties\".",
            "On the \"Ports\" tab, check whether the port in use starts with \"WSD-\". WSD is an automatic discovery method, and after a router restart or an IP change it often fails to find the printer and goes offline.",
            "Click \"Add Port\" > \"Standard TCP/IP Port\" and enter the printer's current IP directly to create a new port.",
            "Select the new port, apply it and print a test page.",
            "If \"SNMP Status Enabled\" is on in the standard TCP/IP port's \"Configure Port\", it can show offline even though printing works when the printer does not answer SNMP, so clear it and compare.",
          ],
        },
        {
          t: "Check the printer's fixed IP and AP isolation on the router",
          tools: [],
          how: [
            "It is common for the printer to get a different IP from the router each time it starts, so it no longer matches the address the PC saved. After the printer starts, compare the IP on its configuration page with the previous one.",
            "If it changes, reserve a fixed IP for the printer's MAC address in the router settings (menu names differ by maker).",
            "Check that the PC is not connected to the router's guest network.",
            "If AP isolation (client isolation) is on in the router's wireless settings, the PC and printer cannot talk to each other even on the same router, so turn it off.",
            "Also check that the printer, which may support only 2.4 GHz, is not on a router set up mainly for 5 GHz.",
          ],
        },
        LIMIT("If it is a shared printer and the sharing PC is off, or it is still offline after the steps above, the router and printer network settings need checking, so it is safer to hand it over."),
      ],
      guides: [],
    },
    r_rdp: {
      mode: "remote",
      title: "If Remote Desktop does not work, check the host edition, settings and firewall in that order",
      lead: "Remote Desktop needs the PC receiving the connection to be Windows Pro or higher, with the feature turned on and allowed through the firewall. First try inside the same network to tell the causes apart.",
      warn: "If it is a company or shop PC, ask the administrator whether the settings are permitted before changing firewall or port settings.",
      steps: [
        {
          t: "Check that the host PC (the one receiving the connection) is Windows Pro or higher",
          tools: [],
          how: [
            "On the PC that receives the connection (the target you connect to remotely), open Settings (Win+I) > System > About.",
            "Check the \"Edition\" under \"Windows specifications\".",
            "If it is Home, you cannot turn on Remote Desktop. This limit applies only to the receiving side; the PC you connect from can be Home.",
            "If you need to help a Home PC remotely, use Windows' built-in Quick Assist app or a separate remote support program.",
            "Write down the edition you found.",
          ],
        },
        {
          t: "Turn on Remote Desktop on the host PC and check the PC name",
          tools: [],
          how: [
            "On the PC that receives the connection, open Settings (Win+I) > System > Remote Desktop.",
            "Turn on the \"Remote Desktop\" switch.",
            "On the same screen, write down this PC's name. You use this name or the IP address when you connect.",
            "You can also check the Remote Desktop port (3389 by default) and the network-level authentication requirement on this screen.",
            "After turning it on, also check that the PC does not go to sleep. You cannot connect while it sleeps.",
          ],
        },
        {
          t: "Check that Remote Desktop is allowed through the firewall",
          tools: [],
          how: [
            "Type \"Control Panel\" in the Start menu search, open it and open \"Windows Defender Firewall\".",
            "On the left, click \"Allow an app or feature through Windows Defender Firewall\".",
            "In the list, check whether the \"Private\" and \"Public\" boxes on the \"Remote Desktop\" row are ticked. The list is long and sorted by name, so you scroll a long way down.",
            "If they are not ticked even though you turned Remote Desktop on, another security program or a policy may have changed the rule.",
            "To look at it rule by rule, run wf.msc from Win+R and check the \"Enabled\" column of \"Remote Desktop - User Mode (TCP-In)\" and \"(UDP-In)\" under Inbound Rules. The default local port is 3389.",
          ],
        },
        {
          t: "Try connecting inside the same network first, and check the VPN for outside access",
          tools: [],
          how: [
            "First try connecting while both PCs are on the same router and the same network.",
            "If it works on the same network but not from home or outside, it is a network path problem.",
            "A company network is usually closed to direct access by PC name from outside, so connect to the company VPN first and then try Remote Desktop.",
            "You can also open it directly with router port forwarding, but it carries security risk, so it is not recommended in a company environment.",
            "Ask your IT administrator how to connect from outside.",
          ],
        },
        {
          t: "If PIN sign-in fails authentication, sign in with the password",
          tools: [],
          how: [
            "This is the case where the sign-in screen appears but entering the PIN fails authentication.",
            "A Windows Hello PIN is not supported by default for Remote Desktop sign-in, so entering the PIN can fail.",
            "On the Remote Desktop connection screen, choose \"Use a different account\".",
            "Sign in with the account password, not the PIN.",
            "If you do not know the password, ask the account administrator.",
          ],
        },
        LIMIT("Company security policy and VPN setup can only be changed by an administrator, so ask your IT staff."),
      ],
      guides: [],
    },
    netq: {
      q: "Does the internet work on other devices connected to the same router (such as a phone on Wi-Fi)?",
      hint: "Connect the phone to the same Wi-Fi, not to mobile data, to check.",
      options: [
        { t: "Other devices fail too", next: "r_router" },
        { t: "Other devices work, only this PC fails", next: "r_pcnet" },
      ],
    },
    r_router: {
      mode: "visit",
      title: "If every device fails, look at the router, the modem and the line",
      lead: "If every device on the same router fails, the problem is more likely in the router, the modem or your internet provider's line than in the PC.",
      steps: [
        S.restartRouter,
        S.cables,
        {
          t: "Check for a provider outage and the modem lights",
          tools: ["Your internet provider's app or customer service contact"],
          how: [
            "In your internet provider's app or the automated line of its customer service, check whether there is a local outage or line maintenance notice.",
            "Look at the modem's internet (or WAN, fiber) light. If it is off or red, the line signal may not be arriving.",
            "If the lights are normal (green, blue or similar and on) and it still fails, the router or the PC settings may be the problem.",
            "Take a photo of the light state with your phone.",
            "If it is not an outage, giving customer service the photo of the modem lights and the symptom speeds up the support.",
          ],
        },
        LIMIT("Line and modem problems often have to be checked by your internet provider's customer service. If router settings or replacing equipment is needed, ask for help."),
      ],
    },
    r_pcnet: {
      mode: "visit",
      title: "If only this PC fails, look at the adapter, the settings and the driver",
      lead: "If other devices work and only this PC fails, the cause is often the PC's network adapter, IP settings, driver or security software.",
      steps: [
        {
          t: "Check Airplane mode and that Wi-Fi is on",
          tools: [],
          how: [
            "Click the network icon (the Wi-Fi or globe shape) at the bottom right of the taskbar.",
            "Check that \"Airplane mode\" is off. If it is on, click it to turn it off.",
            "On a laptop, check that the wireless on/off Fn key on the top row of the keyboard (the antenna icon) or a hardware switch on the side of the laptop is not switched off.",
            "Click the Wi-Fi button to turn it off and on again. After a few seconds the list of available Wi-Fi networks appears.",
            "Select your home Wi-Fi name, enter the password and connect.",
          ],
        },
        S.cables,
        {
          t: "Run the Windows network troubleshooter",
          tools: [],
          how: [
            "Open Settings (Win+I) > System > Troubleshoot > Other troubleshooters.",
            "Click \"Run\" next to \"Internet Connections\".",
            "Choose \"Troubleshoot my connection to the Internet\" and follow the instructions.",
            "If the troubleshooter finds a problem, click \"Apply this fix\". If it says it could not find one, go to the next step.",
            "Remember the problem the troubleshooter found and the result of the fix.",
          ],
        },
        S.ipRenew,
        S.adapterDriver,
        S.vpnSecurity,
        LIMIT("If it still fails, cleaning up the settings, such as a network reset, may be needed. If that is hard to do yourself, it is safer to hand it over."),
      ],
    },
    r_wifidrop: {
      mode: "remote",
      title: "If Wi-Fi drops, separate the distance, the router, the driver and the power saving setting",
      lead: "When Wi-Fi drops often or is weak, the common candidates are the signal distance, the state of the router, the wireless LAN driver and the adapter's power saving setting.",
      steps: [
        {
          t: "Check the distance and obstacles to the router, and try switching between 5 GHz and 2.4 GHz",
          tools: [],
          how: [
            "Carry the laptop or PC close to the router. See whether the same symptom appears. Many walls or household appliances can weaken the signal.",
            "If it works close by but fails far away, it is a signal problem. You can move the router to a central spot or use a range extender.",
            "If the router supports both 5 GHz and 2.4 GHz, try connecting to the other band in the Wi-Fi list (the name often has 5G added after it).",
            "5 GHz is fast but weak at a distance; 2.4 GHz reaches farther but is easily disturbed by interference from things like microwave ovens and Bluetooth.",
            "Note whether the symptom changes with the band you connected to.",
          ],
        },
        S.restartRouter,
        S.adapterDriver,
        {
          t: "Turn off the adapter power saving option",
          tools: [],
          how: [
            "Right-click the Start button and open \"Device Manager\".",
            "Expand \"Network adapters\" and double-click the Wi-Fi adapter (a name containing Wireless, Wi-Fi and so on).",
            "Click the \"Power Management\" tab.",
            "Clear the check box \"Allow the computer to turn off this device to save power\" and click OK.",
            "After restarting, watch for a few days to see whether the dropouts decrease.",
          ],
        },
        S.otherNet,
        {
          t: "Connect by cable to compare",
          tools: ["A network cable (long enough to reach from the PC to the router)"],
          how: [
            "Connect the PC directly to the router (a LAN port) with a network cable. A laptop without a LAN port needs a USB LAN adapter.",
            "Once connected, the taskbar network icon changes to an Ethernet shape. It is best to keep Wi-Fi turned off during this so the comparison is clear.",
            "Use it for at least 10 minutes to see whether the same symptom (dropouts, slow speed and so on) appears.",
            "If it drops on the cable too, the router or the line is the likely cause; if it is stable on the cable, the Wi-Fi signal or the wireless LAN adapter is the likely cause.",
            "Give this result when you ask for help.",
          ],
        },
      ],
    },
    r_site: {
      mode: "remote",
      title: "If only certain sites fail, tell whether the PC or the site is the problem",
      lead: "If other sites work and only one won't open, it may be a problem with that site itself, or the DNS cache, browser data or a network block may be the cause.",
      steps: [
        S.otherDevice,
        {
          t: "Try opening it in another browser",
          tools: [],
          how: [
            "Open a browser other than the one you use now (Chrome and so on), such as Edge or Firefox.",
            "Type the same address and try to open it.",
            "If it works in the other browser, the cache, extensions or settings of the original browser are the problem.",
            "If it fails in both, the problem is on the PC or network side, or in the site.",
            "Remember the result for deciding the next steps.",
          ],
        },
        S.flushDns,
        S.otherNet,
        {
          t: "Delete the cookies and cache for that site",
          tools: [],
          how: [
            "Click the padlock (or settings-shaped) icon at the left of the browser address bar.",
            "Under \"Cookies and site data\" (or \"Site settings\"), delete that site's data.",
            "To clear everything, in the browser's \"Clear browsing data\" (Ctrl+Shift+Delete), choose \"Cached images and files\" and \"Cookies and other site data\" and delete them. You may be signed out, so check the account details you need.",
            "After deleting, close the browser completely and open it again.",
            "Try the same address.",
          ],
        },
      ],
    },
    r_refused: {
      mode: "remote",
      title: "For a refused connection, check the hosts file, the proxy and the site's status",
      lead: "ERR_CONNECTION_REFUSED means the address was found but the connection was turned down. Either the site's server has a problem, or the PC's hosts file or proxy settings are sending the connection to the wrong place.",
      warn: "On a company or shop PC, before you change the hosts file or the proxy settings, first ask the administrator whether the block is intended.",
      steps: [
        {
          t: "Check the error text and how it behaves on other sites and other devices",
          tools: ["A phone or another PC"],
          how: [
            "Read the small ERR_ text (for example ERR_CONNECTION_REFUSED) at the bottom of the browser page exactly, and write it down.",
            "The difference in meaning: ERR_CONNECTION_REFUSED means the connection was turned down, ERR_NAME_NOT_RESOLVED means the address could not be found, and ERR_CONNECTION_TIMED_OUT means there was no response. The likely causes point in different directions.",
            "Check whether another site such as a major website opens. If other sites work and only one site fails, the problem is that site or the route to it.",
            "Open the same address on a phone or another PC to tell whether the problem is only on this PC.",
            "Give the text and the result when you ask for help.",
          ],
        },
        {
          t: "Check the proxy settings",
          tools: [],
          how: [
            "Open Settings (Win+I) > Network & internet > Proxy.",
            "Check the state of \"Automatically detect settings\", \"Use setup script\" and \"Use a proxy server\".",
            "If \"Use a proxy server\" is on and an address you do not recognize is written there, check whether it is an intended setting. On a company or school PC it may have been put there by the administrator.",
            "If you have never set it yourself, turn \"Use a proxy server\" off.",
            "Open the browser again and try to connect.",
          ],
        },
        {
          t: "Look for a line for that site in the hosts file",
          tools: [],
          how: [
            "Open a Command Prompt (cmd) and type ping site-address (for example ping example.com). Check the IP on the top line. If 127.0.0.1 appears, the hosts file is sending the connection back to this PC itself.",
            "Type \"Notepad\" in the Start menu search, right-click it and choose \"Run as administrator\".",
            "In Notepad, go to File → Open and move to the folder C:\\Windows\\System32\\drivers\\etc. Change the file type to \"All files\" and open the hosts file.",
            "If there is a line with that site's address, check whether it is an intended setting. Lines that start with # are explanations and can be ignored.",
            "If it is a line you do not recognize, put # at the start of the line to comment it out and save. If you write down the original content, you can put it back.",
            "After saving, open the browser again and try to connect.",
          ],
          note: "The hosts file on a company or shop PC may hold a block that the administrator put there on purpose, so check before you delete anything.",
        },
        S.flushDns,
      ],
    },
    r_updbroken: {
      mode: "visit",
      title: "If the internet broke after an update, look at the adapter and the driver first",
      lead: "When the network drops after a Windows update, often the network adapter driver has changed or the network settings have become tangled.",
      steps: [
        S.adapterDriver,
        {
          t: "Roll back the network adapter driver",
          tools: [],
          how: [
            "Right-click the Start button and open \"Device Manager\".",
            "Expand \"Network adapters\" and double-click the adapter you use (Wi-Fi or Ethernet).",
            "Click the \"Driver\" tab and click the \"Roll Back Driver\" button. In the window that asks the reason, choose any item and click \"Yes\".",
            "If the button is disabled (gray), there is no earlier record to go back to.",
            "After restarting, check the connection.",
          ],
        },
        {
          t: "Reset the winsock and TCP/IP settings",
          tools: [],
          how: [
            "Type \"cmd\" in the taskbar search. Right-click the \"Command Prompt\" result, choose \"Run as administrator\" and click \"Yes\".",
            "In the black window, type netsh winsock reset and press Enter. A message such as \"Successfully reset the Winsock Catalog.\" appears.",
            "Next, type netsh int ip reset and press Enter.",
            "These two commands return the network settings to their defaults. On a PC that uses a VPN or a special fixed IP setting, you may need to set it up again.",
            "Restart the PC.",
            "After the restart, check the connection and the symptom again.",
          ],
        },
        S.vpnSecurity,
        LIMIT("To get the driver you need another device with working internet, and if it still fails, a network reset or a Windows repair may be needed, so it is safer to hand it over."),
      ],
    },
    r_game: {
      mode: "remote",
      title: "For game server connection problems, separate the server status, the router and DNS",
      lead: "Common causes of game connection errors are the game company's server maintenance, an unstable router or line, DNS problems and factors such as a VPN. First tell whether the internet itself works.",
      steps: [
        {
          t: "Check the game company's official notices for server maintenance or an outage",
          tools: [],
          how: [
            "Open the game's official site or official notice board and check whether there is a server maintenance or outage announcement.",
            "In the official community (Discord, an official forum and so on), check whether other players cannot connect at the same time.",
            "If it is a server problem, there is nothing you can do on the PC side, so wait for the recovery.",
            "If there is no notice and it fails only for you, go to the next step.",
          ],
        },
        S.restartRouter,
        {
          t: "Test turning off the VPN and changing the DNS",
          tools: [],
          how: [
            "If a VPN is on, turn it off and try to connect.",
            "In Settings (Win+I) > Network & internet, click the connection you use (Wi-Fi or Ethernet). Click \"Edit\" next to \"DNS server assignment\".",
            "Change \"Automatic (DHCP)\" to \"Manual\" and turn IPv4 on.",
            "Enter a public DNS address (for example 8.8.8.8 or 1.1.1.1) as the preferred DNS and save.",
            "Check whether you can connect.",
            "When the test is over and you no longer need it, set \"DNS server assignment\" back to \"Automatic (DHCP)\".",
          ],
        },
        {
          t: "Clear the game launcher cache and try again",
          tools: [],
          how: [
            "Quit the game launcher (Steam, Battle.net and so on) completely. Also check the hidden icons at the right of the taskbar, and end its processes in Task Manager (Ctrl+Shift+Esc).",
            "If the launcher's settings have an item such as \"Clear cache\" or \"Clear download cache\", use it. The name and the place of the item differ by game.",
            "If the official support documentation describes a way to clear the cache, follow that first.",
            "Restart the PC.",
            "Start the game and try to connect.",
          ],
        },
        S.cables,
      ],
    },
    r_netdrive: {
      mode: "remote",
      title: "For a network drive, check the target device, the credentials and the sharing settings",
      lead: "When a shared folder or NAS won't open, check in order whether the target device is on, whether it is on the same network, and whether the saved sign-in details and the sharing settings are right.",
      steps: [
        {
          t: "Check that the target device is on and on the same network",
          tools: [],
          how: [
            "Check that the PC or NAS that holds the shared folder is on. It may have gone into sleep, so try waking it.",
            "Check that the target device is connected to the same router. If there are two or more routers, they may be different networks.",
            "On the PC, open a Command Prompt and type ping target-device-IP. You can find the target's IP on the device's management screen or in the router's list of connected devices.",
            "If a \"Reply from\" line appears, a response is coming back. If \"Request timed out.\" appears, there is no response.",
            "If there is no response, start by checking the target device's power and network connection.",
          ],
        },
        {
          t: "Delete the saved sign-in details (credentials) and enter them again",
          tools: [],
          how: [
            "Type \"Credential Manager\" in the Start menu search and open it.",
            "Click \"Windows Credentials\".",
            "If there is a saved entry for the target device (its IP or name), expand it and click \"Remove\". Do not delete entries you do not recognize.",
            "In the File Explorer address bar, type \\\\device-name or \\\\IP-address to connect to the shared folder.",
            "Enter the account and password again and tick \"Remember my credentials\".",
          ],
        },
        {
          t: "Turn on network discovery and file sharing",
          tools: [],
          how: [
            "Open Settings (Win+I) > Network & internet > Advanced network settings > Advanced sharing settings.",
            "Expand \"Private networks\". The type of the network you are connected to now must be \"Private\".",
            "Turn on \"Network discovery\" and \"File and printer sharing\".",
            "If you are connected as a public network, it is better to change a home or office network to private. In Settings > Network & internet > Wi-Fi (or Ethernet) > the properties of that connection, choose \"Private network\".",
            "Do not turn these on in a public place such as a cafe.",
          ],
        },
        {
          t: "Remove the drive connection and connect again",
          tools: [],
          how: [
            "Open \"This PC\" in File Explorer.",
            "Right-click the network drive (the icon with a letter) and choose \"Disconnect\".",
            "From the \"...\" menu at the top, choose \"Map network drive\".",
            "Pick a drive letter and enter the folder path (in the form \\\\device-name\\folder).",
            "Tick \"Reconnect at sign-in\". If credentials are needed, tick \"Connect using different credentials\" and enter them.",
            "Click Finish and check that it connects.",
          ],
        },
        LIMIT("If it still fails, the shared folder permissions or the NAS settings need to be checked, so it is safer to hand it over."),
      ],
    },
  };

  window.ITSVC_WIZARD = { nodes: NODES };

  // Per-step notes (c: cause candidate, m: rough time, l: difficulty, w: why, r: how to read the result). The time is a
  // rough estimate based on the kind of task, not a measurement. Site tools that exist only in Korean are not linked.
  window.ITSVC_WIZARD_META = Object.assign(window.ITSVC_WIZARD_META || {}, {
    "Check the printer's power and connection, and switch it off and on": {"c": "Printer sleep or a dropped connection", "m": "About 5 min", "l": "Easy", "w": "If the printer goes to sleep or the connection drops, it shows as offline. Check the easiest things first.", "r": "If it becomes ready after switching off and on → it was a temporary dropped connection."},
    "Restart the Print Spooler service": {"c": "The Print Spooler service stopped", "m": "About 3 min", "l": "Easy", "w": "When the spooler stops, the printer shows as offline even if it is fine.", "r": "If it prints after the restart → it was a temporary service error."},
    "Clear \"Use Printer Offline\" and set it as the default printer again": {"c": "The Use Printer Offline option being on", "m": "About 3 min", "l": "Easy", "w": "While this option is on, it keeps showing as offline even when connected.", "r": "If the status changes after clearing it → the option was the problem."},
    "Use ping to separate the network part from the port and spooler part": {"c": "Separating the network connection from the PC-side settings", "m": "About 5 min", "l": "Moderate", "w": "Whether replies come back decides whether to fix the PC or the network.", "r": "If replies come back → the PC-side port or spooler is the problem. If it times out → the connection itself is."},
    "Change a WSD port to a standard TCP/IP port": {"c": "Checking the automatic WSD port and SNMP status", "m": "About 10 min", "l": "Moderate", "w": "When the IP changes or the router is switched off and on, an automatic discovery port can lose the printer, so write the address in directly to settle it.", "r": "If the offline status goes away after changing → the port method was the cause."},
    "Check the printer's fixed IP and AP isolation on the router": {"c": "Router IP changes, guest network and AP isolation", "m": "About 15 min", "l": "Moderate", "w": "Even on the same Wi-Fi, a router option can stop the PC and printer from seeing each other.", "r": "If it settles after reserving the IP or turning isolation off → the router setting was the cause."},
    "Check that the host PC (the one receiving the connection) is Windows Pro or higher": {"c": "The Windows Home edition limit", "m": "About 3 min", "l": "Easy", "w": "The most common cause of a failed Remote Desktop connection is the host PC being Home.", "r": "If it is Home → you cannot turn on Remote Desktop. Use another way of remote support."},
    "Turn on Remote Desktop on the host PC and check the PC name": {"c": "Remote Desktop turned off, or a typo in the PC name", "m": "About 5 min", "l": "Easy", "w": "You have to turn the feature on at the host to receive connections, and the name or IP has to be right.", "r": "If it connects after turning it on and checking the name → it had been turned off."},
    "Check that Remote Desktop is allowed through the firewall": {"c": "The firewall blocking Remote Desktop", "m": "About 10 min", "l": "Moderate", "w": "If the firewall blocks port 3389, there is no response even when you enter the name or IP correctly.", "r": "If it connects after allowing it → the firewall was the cause."},
    "Try connecting inside the same network first, and check the VPN for outside access": {"c": "The outside network path and the VPN", "m": "About 10 min", "l": "Moderate", "w": "When it works inside but not from outside, it is often a connection path problem, not a PC setting.", "r": "If it works inside and fails only from outside → check the VPN or the path."},
    "If PIN sign-in fails authentication, sign in with the password": {"c": "PIN sign-in not supported", "m": "About 3 min", "l": "Easy", "w": "A PIN is not supported by default for Remote Desktop sign-in, so you have to enter the password.", "r": "If it signs in with the password → it was a PIN problem."},
    "Restart the modem and router": { c: "Temporary router or modem error", m: "About 5 min", l: "Easy", w: "A router left on for a long time can freeze up for a while. Unplugging it and plugging it back in clears it in most cases.", r: "If it connects after restarting → it was a temporary error." },
    "Check the network cable and ports": { c: "Poor network cable or port contact", m: "About 10 min", l: "Easy", w: "If the cable is loose or bent, the connection drops. Compare by swapping to another cable or port.", r: "If it connects after swapping → the cable or port is the problem." },
    "Check for a provider outage and the modem lights": { c: "Internet provider line outage", m: "About 5 min", l: "Easy", w: "When the problem is outside your home (at the provider), nothing you do on your side helps. An outage notice and the modem lights tell you quickly.", r: "If the internet light is off or there is an outage notice → it is the provider's problem." },
    "Check Airplane mode and that Wi-Fi is on": { c: "Wireless switched off in settings", m: "About 3 min", l: "Easy", w: "If wireless is off, of course the internet does not work. Airplane mode or a wireless switch that has been pressed is surprisingly common.", r: "If it connects after turning it on → wireless had been off." },
    "Run the Windows network troubleshooter": { c: "Network settings error", m: "About 10 min", l: "Easy", w: "Windows looks for common problems and tries to fix them automatically. It is the easiest method before you touch the settings yourself.", r: "If the troubleshooter finds and fixes a problem → it was a settings error." },
    "Renew the IP address and clear the DNS cache": { c: "IP or DNS setting error", m: "About 10 min", l: "Moderate", w: "If the address information (IP) received from the router gets tangled, the connection fails. Getting it again often clears it.", r: "If it connects after running the commands → the address information was tangled." },
    "Check and reinstall the network adapter driver": { c: "Network driver problem", m: "About 20 min", l: "Moderate", w: "If the software (driver) that runs the network card gets tangled, the connection is unstable. Removing it and letting Windows detect it again installs it fresh.", r: "If it connects after reinstalling → it was a driver problem." },
    "Turn off the VPN and security software briefly and check": { c: "Interference from VPN or security software", m: "About 10 min", l: "Easy", w: "A VPN or security software sometimes blocks the connection. Turn it off for a moment to compare whether it matters.", r: "If it connects after turning it off → that program's settings are the cause." },
    "Check the distance and obstacles to the router, and try switching between 5 GHz and 2.4 GHz": { c: "Weak signal or band problem", m: "About 10 min", l: "Easy", w: "Wi-Fi gets weaker when it is far away or there are many walls. 5 GHz is fast but weak at a distance, and 2.4 GHz reaches farther but is weak against interference.", r: "If it becomes stable when closer or on the other band → it is a signal environment problem." },
    "Turn off the adapter power saving option": { c: "Adapter power saving setting", m: "About 10 min", l: "Moderate", w: "Windows sometimes switches the wireless adapter off for a moment to save power, and it drops out. Turn that option off.", r: "If the dropouts decrease after turning it off → the power saving setting was the cause." },
    "Check whether it behaves the same on another network (a phone hotspot)": { c: null, m: "About 10 min", l: "Easy", w: "Seeing whether it works on a phone hotspot tells you whether the PC or the home router or line is the problem.", r: "If it works on the hotspot and fails only at home → it is the router or the line." },
    "Connect by cable to compare": { c: null, m: "About 10 min", l: "Easy", w: "Connecting by cable tells you whether the problem is only Wi-Fi or the whole line.", r: "If the cable is stable → it is the wireless signal or the wireless LAN." },
    "Check whether it behaves the same on another device (a phone or another PC)": { c: null, m: "About 5 min", l: "Easy", w: "If other devices on the same router fail too, it is not a PC problem. It is the yardstick for deciding where to look first.", r: "If other devices work and only this PC fails → it is a PC settings problem." },
    "Try opening it in another browser": { c: "Browser cache or extension problem", m: "About 5 min", l: "Easy", w: "This separates whether the browser or the site is the problem. If it opens in another browser, you only need to fix the browser you were using.", r: "If it opens in another browser → the original browser (cache, extensions) is the problem." },
    "Clear the DNS cache": { c: "DNS cache problem", m: "About 5 min", l: "Moderate", w: "If the information the computer remembers about site addresses (the DNS cache) gets off, certain sites won't open. Clearing it makes it look them up again.", r: "If it opens after clearing → old address information was the problem." },
    "Delete the cookies and cache for that site": { c: "Site cookie or cache problem", m: "About 5 min", l: "Easy", w: "If the temporary information saved for that site gets tangled, it may not open. Deleting it lets you connect as if for the first time.", r: "If it opens after deleting → the saved data was the problem." },
    "Check the error text and how it behaves on other sites and other devices": { c: null, m: "About 5 min", l: "Easy", w: "The browser's error text (ERR_…) points to the likely direction of the cause. Each text means something different, so it matters to read it exactly.", r: "If it is the same on other devices → it is likely a problem with the site or the network." },
    "Check the proxy settings": { c: "Proxy settings", m: "About 5 min", l: "Easy", w: "If a proxy is on, the connection goes through somewhere else and can be blocked. Suspect it if it is on and you never turned it on yourself.", r: "If it opens after turning it off → the proxy setting is the cause." },
    "Look for a line for that site in the hosts file": { c: "hosts file setting", m: "About 10 min", l: "Moderate", w: "The hosts file is a notebook that sends certain addresses to the wrong place. If there is a line here, the site may be refused.", r: "If there is a line for that site → the connection was being redirected." },
    "Roll back the network adapter driver": { c: "Effect of a driver update", m: "About 10 min", l: "Moderate", w: "If the network dropped after an update, the new driver may be the cause. Try going back to the earlier version.", r: "If it connects after going back → the new driver is the cause." },
    "Reset the winsock and TCP/IP settings": { c: "Damaged network settings", m: "About 10 min", l: "Moderate", w: "This is a way to return the network communication settings to their original state when they get tangled. It is a reversible settings reset.", r: "If it connects after the reset → the communication settings were tangled." },
    "Check the game company's official notices for server maintenance or an outage": { c: "Game server maintenance or outage", m: "About 5 min", l: "Easy", w: "If the server is down for maintenance, there is nothing to do on your side. Looking at the official notice first saves wasted effort.", r: "If there is a maintenance or outage notice → wait for the recovery." },
    "Test turning off the VPN and changing the DNS": { c: "VPN or DNS problem", m: "About 10 min", l: "Moderate", w: "A VPN or DNS can get in the way of the game server connection. Turn it off or switch to a public DNS to compare.", r: "If you can connect after changing it → the VPN or DNS was the cause." },
    "Clear the game launcher cache and try again": { c: "Launcher cache problem", m: "About 10 min", l: "Easy", w: "If temporary files piled up in the game launcher get tangled, sign-in can fail. Clear them and try again.", r: "If you can connect after clearing → it was a launcher cache problem." },
    "Check that the target device is on and on the same network": { c: "Target device power or network", m: "About 5 min", l: "Easy", w: "If the PC or NAS that holds the shared folder is off or on a different network, of course it won't open. Check the basics first.", r: "If there is no reply (ping) → check the target device's power and connection first." },
    "Delete the saved sign-in details (credentials) and enter them again": { c: "Error in saved sign-in details", m: "About 5 min", l: "Easy", w: "If an old saved password is left, the connection keeps being refused. Deleting it and entering it fresh clears it.", r: "If you connect after deleting → the old sign-in details were the problem." },
    "Turn on network discovery and file sharing": { c: "Sharing turned off", m: "About 10 min", l: "Easy", w: "If the Windows sharing feature is off, folders do not appear. Turn it on under the private network.", r: "If the folder appears after turning it on → it was a sharing settings problem." },
    "Remove the drive connection and connect again": { c: "Drive connection settings", m: "About 10 min", l: "Easy", w: "If the connection information has gone off, removing it and connecting again is the cleanest.", r: "If it opens after connecting again → the connection information was tangled." },
  });
})();
