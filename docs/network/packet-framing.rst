Packet Framing — Magic Terminator
================================

This short note explains how packets are framed and reassembled in the
network packages, at a logical level. The framing strategy is
simple and robust to transport fragmentation or aggregation.

Concept
-------

- Each logical packet is a payload of bytes that the application wants to
  send (JSON or binary).
- Before sending, the library *appends* a configurable terminator string
  (the "magic value") to the end of the payload. The default value in the
  project config is `PACKET_END`.
- The terminator is applied as bytes (UTF-8 encoding of the configured
  string) and therefore forms a unique byte suffix that marks the end of a
  logical packet.

Why an end terminator
---------------------

- Transports like WebSocket and RTC DataChannels may split or combine
  application messages into arbitrary chunks. A terminator lets a receiver
  reliably detect the end of each logical packet regardless of how the
  transport fragments or aggregates bytes.
- Using a short, human-readable terminator makes debugging easier.
- The terminator is configurable so you can pick a value that does not
  collide with your payload contents (especially important if using raw or
  binary payloads).

Sender logic
---------------------------

1. Serialize the application message into bytes (e.g., JSON => UTF-8
   bytes, or a binary codec output).
2. Append the configured terminator bytes to the end of the payload.
3. Send the resulting buffer on the transport (WebSocket or DataChannel).

Receiver logic
-----------------------------

1. Accumulate incoming chunks of bytes into a per-connection buffer.
2. Repeatedly search the accumulated buffer for the terminator sequence.
3. For each occurrence, extract bytes from buffer start up to (but not
   including) the terminator — this is a complete logical packet.
4. Remove the extracted packet and trailing terminator from the buffer and
   continue searching; keep any leftover bytes (partial packet) for the
   next incoming chunk.
