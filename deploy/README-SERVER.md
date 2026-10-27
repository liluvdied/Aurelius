# Aurelius on a server (runs 24/7, laptop off)

She runs exactly as on your Mac: same code, same data, same keys. The desk page is private: only your own devices on
your Tailscale network can open it (the server's firewall blocks everyone else).

## 1. Make the server (5 min, about $12/month)
- DigitalOcean -> Create -> Droplet. Ubuntu 24.04. Region: New York or San Francisco (must be in the US for
  Kalshi + Polymarket US). Size: Basic, 2 GB RAM / 1 CPU. Authentication: SSH key (add your Mac's key).
- Note the droplet's IP address.

## 2. Tailscale (free) on your phone and Mac
- Install Tailscale from the App Store on both, sign in with one account. This is the private tunnel to her.

## 3. Send her up
- On your Mac, double-click `deploy/push-from-mac.command`, paste the server IP, and say **y** to FIRST time (sends her data).
- Say **y** when it asks to copy your keys (`.secrets`). They travel over your own SSH connection only.

## 4. Start her (once)
- In Terminal:  `ssh root@YOUR_IP`  then  `bash /opt/aurelius/deploy/setup-server.sh`
- It prints a Tailscale sign-in link: open it, approve. Then it prints her address: `http://100.x.x.x:8080`.
  Save that on your phone's home screen.

## 5. IMPORTANT: only ONE Aurelius at a time
- Close `Start Aurelius.command` on your Mac BEFORE step 4. Two desks with LIVE on would place every order twice.
- From now on, change her by editing on the Mac, then double-click `push-from-mac.command` and run
  `ssh root@YOUR_IP systemctl restart aurelius`. Answer **N** to FIRST time: only code goes up, her live data on the server is never touched.

## Day to day
- Restarts on her own after a crash or a reboot; a watchdog restarts her if her heartbeat goes quiet 4+ minutes.
- Logs:  `ssh root@YOUR_IP journalctl -u aurelius -f`
