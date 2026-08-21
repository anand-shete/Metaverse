To build a solid foundation for your 2D Metaverse project, it is essential to understand that while WebRTC is the industry standard for real-time browser communication.

### Core WebRTC Architectures for Audio/Video calling

There are three main architectural patterns used for real-time media, each with different scaling limits.

#### 1. Peer-to-Peer (Mesh) — Your Current State

In a pure P2P setup (like your current Peer.js implementation), every user sends their media stream directly to every other user.

- Pros: Lowest latency since there is no middleman; zero server-side media processing costs; built-in privacy.
- Cons: Scalability is severely limited $O(N²)$. Each participant's upload bandwidth must support a stream for every other person. Performance typically degrades beyond 4 participants.
- Best for: 1:1 calls or very small groups.



#### 2. Selective Forwarding Unit (SFU) — The Industry Standard

An SFU is a media server that receives one stream from each participant and forwards it to all others. It does not modify the media, just routes it.

- Pros: High scalability. A single peer only ever uploads one stream, regardless of how many people are watching.
- Cons: Requires server infrastructure; the server must have high bandwidth to forward all those streams.
- Popular Tools: [LiveKit](https://github.com/livekit/livekit), [mediasoup](https://mediasoup.org/), Janus, and [Jitsi](https://en.wikipedia.org/wiki/Jitsi).
- Best for: Group video conferencing and metaverse projects.



#### 3. Multipoint Control Unit (MCU)

An MCU receives all incoming streams and "mixes" them into a single composite video/audio stream before sending it back to participants.

- Pros: The client only ever downloads one stream, making it ideal for low-end devices or legacy systems.
- Cons: Extremely CPU-intensive for the server because it has to decode, resize, and re-encode everyone's video.
- Best for: Legacy SIP(Session Initiation Protocol) integrations or specialized hardware.

> Can be implemented CPaaS(Agora, ZegoCloud) or LiveKit (Self-hosted or Cloud managed) or mediasoup(high control)



### Modern Architectural Trends for 2026

- SFU Cascading: For global scale, multiple SFU nodes are clustered (often using Redis for coordination). A user connects to the nearest regional node to minimize "last-mile" latency.
- Hybrid Approaches: Many modern systems use P2P for 1:1 calls to save costs and automatically switch to an SFU once a third or fourth person joins.
- Media over QUIC (MoQ): This is the emerging standard for massive broadcast fan-out (10k+ viewers) where WebRTC is used for the "talent" (broadcasters) and QUIC-based protocols handle the massive distribution.

Given your Fastify backend and React frontend, transitioning to an SFU (like LiveKit or mediasoup) would be the most "rock solid" move to support the many-to-many interactions typical in a virtual campus metaverse.
Do you feel comfortable with the O(N²) math of your current mesh, or should we look into how to integrate a specific SFU like LiveKit into your Fastify stack?

### Network Address Translation

Most devices sit behind a **Network Address Translation** (NAT) device, like a home router, which assigns them a private IP address. Because this private IP is not reachable from the public internet, two browsers cannot simply "call" each other directly without help to find their public-facing addresses and bypass firewalls.

STUN and TURN servers are critical infrastructure components in WebRTC that solve the problem of NAT Traversal, allowing devices to find and connect to each other over the internet.

### Session Traversal Utilities for NAT (STUN)

STUN server allows a device to discover its own public IP address and port number, as seen by the outside world.

- A client sends a request to the STUN server; the server replies with the public IP/port from which the request originated.
- STUN is a lightweight, low-resource protocol used only during the initial connection setup. It facilitates direct peer-to-peer (P2P) communication, which keeps latency low (typically 50–150 ms).



### Traversal Using Relays around NAT (TURN)

A TURN server acts as a backup intermediary when a direct connection is impossible. It relays all media traffic between peers when direct communication is blocked by restrictive firewalls or complex network types like "Symmetric NAT".

- It is a fallback for when STUN fails to establish a direct link. This is common in corporate or highly secure networks.
- Because all audio/video data must flow through the TURN server throughout the entire call, it increases infrastructure costs and can introduce higher latency due to the extra "hop" the data must take



#### How they work together (ICE)

In a real-world WebRTC application, you use both through a framework called Interactive Connectivity Establishment (ICE).

- ICE first tries to establish a direct connection using STUN to find the most efficient path.
- If direct connection fails, ICE automatically switches to using a TURN server to relay the data, ensuring the call still goes through regardless of network restrictions.

> Tools like Coturn are popular among developers because they can function as both a STUN and a TURN server in a single implementation.

