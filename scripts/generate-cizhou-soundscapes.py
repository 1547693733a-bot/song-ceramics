from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np


SAMPLE_RATE = 22_050
DURATION = 24.0
SAMPLE_COUNT = int(SAMPLE_RATE * DURATION)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "assets" / "kilns" / "cizhou-traits" / "audio"


def periodic_noise(rng: np.random.Generator, low_hz: float, high_hz: float, slope: float = 0.0) -> np.ndarray:
    frequencies = np.fft.rfftfreq(SAMPLE_COUNT, 1 / SAMPLE_RATE)
    spectrum = np.zeros_like(frequencies, dtype=np.complex128)
    active = (frequencies >= low_hz) & (frequencies <= high_hz)
    safe_frequency = np.maximum(frequencies[active], 1.0)
    amplitude = safe_frequency ** (-slope / 2)
    phase = rng.uniform(0, 2 * np.pi, active.sum())
    spectrum[active] = amplitude * np.exp(1j * phase)
    signal = np.fft.irfft(spectrum, n=SAMPLE_COUNT)
    deviation = np.std(signal)
    return signal / deviation if deviation > 0 else signal


def add_event(track: np.ndarray, event: np.ndarray, start_seconds: float) -> None:
    start = int(start_seconds * SAMPLE_RATE)
    end = min(track.size, start + event.size)
    if start >= track.size or end <= start:
        return
    track[start:end] += event[: end - start]


def fade_event(event: np.ndarray, attack: float = 0.08, release: float = 0.32) -> np.ndarray:
    size = event.size
    attack_size = max(1, int(size * attack))
    release_size = max(1, int(size * release))
    envelope = np.ones(size)
    envelope[:attack_size] = np.sin(np.linspace(0, math.pi / 2, attack_size)) ** 2
    envelope[-release_size:] = np.cos(np.linspace(0, math.pi / 2, release_size)) ** 2
    return event * envelope


def make_clink(duration: float, pitch: float, strength: float = 1.0) -> np.ndarray:
    count = int(SAMPLE_RATE * duration)
    time = np.arange(count) / SAMPLE_RATE
    envelope = np.exp(-time * 10.5)
    tone = (
        np.sin(2 * np.pi * pitch * time)
        + 0.44 * np.sin(2 * np.pi * pitch * 1.61 * time)
        + 0.2 * np.sin(2 * np.pi * pitch * 2.27 * time)
    )
    return tone * envelope * 0.12 * strength


def create_tavern(rng: np.random.Generator) -> np.ndarray:
    time = np.arange(SAMPLE_COUNT) / SAMPLE_RATE
    room = 0.046 * periodic_noise(rng, 85, 1_500, slope=1.25)
    walla = np.zeros(SAMPLE_COUNT)
    for index in range(10):
        base = rng.uniform(105, 235)
        modulation = rng.uniform(0.08, 0.24)
        phase = rng.uniform(0, 2 * np.pi)
        voice = (
            np.sin(2 * np.pi * base * time + modulation * np.sin(2 * np.pi * rng.uniform(0.08, 0.16) * time + phase))
            + 0.34 * np.sin(2 * np.pi * base * 2.03 * time + phase)
            + 0.16 * np.sin(2 * np.pi * base * 3.1 * time + phase * 0.7)
        )
        speech_pulse = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.13, 0.31) * time + phase)
        speech_pulse = np.clip((speech_pulse - 0.24) / 0.76, 0, 1) ** 1.8
        walla += voice * speech_pulse * rng.uniform(0.0035, 0.007)
    track = room + walla
    for start, pitch, strength in [(3.8, 1_320, 0.8), (8.6, 1_580, 1.0), (15.2, 1_410, 0.72), (20.3, 1_760, 0.86)]:
        add_event(track, make_clink(0.52, pitch, strength), start)
    pour = fade_event(periodic_noise(rng, 650, 4_200, slope=0.5)[: int(SAMPLE_RATE * 1.7)] * 0.034, 0.18, 0.42)
    add_event(track, pour, 11.4)
    return track


def create_interior(rng: np.random.Generator) -> np.ndarray:
    time = np.arange(SAMPLE_COUNT) / SAMPLE_RATE
    room = 0.026 * periodic_noise(rng, 45, 620, slope=1.55)
    distant_voice = 0.0038 * (
        np.sin(2 * np.pi * 132 * time + 0.2 * np.sin(2 * np.pi * 0.11 * time))
        + 0.43 * np.sin(2 * np.pi * 219 * time + 1.4)
    )
    distant_voice *= (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * time + 0.8)) ** 3
    track = room + distant_voice
    rustle_source = periodic_noise(rng, 260, 3_100, slope=0.7)
    for start, duration, level in [(5.1, 0.9, 0.027), (13.7, 1.2, 0.023), (19.1, 0.65, 0.021)]:
        count = int(duration * SAMPLE_RATE)
        rustle = fade_event(rustle_source[:count] * level, 0.25, 0.5)
        add_event(track, rustle, start)
    for start, pitch in [(9.6, 1_080), (18.3, 1_230)]:
        add_event(track, make_clink(0.48, pitch, 0.48), start)
    return track


def create_night(rng: np.random.Generator) -> np.ndarray:
    track = 0.022 * periodic_noise(rng, 28, 540, slope=1.75)
    time = np.arange(SAMPLE_COUNT) / SAMPLE_RATE
    track *= 0.82 + 0.18 * np.sin(2 * np.pi * time / DURATION)
    for cluster_start, base_pitch in [(1.1, 3_450), (4.9, 3_850), (9.2, 3_250), (14.1, 4_050), (18.0, 3_620), (21.4, 3_300)]:
        for pulse_index in range(4):
            duration = 0.12 + pulse_index * 0.01
            count = int(duration * SAMPLE_RATE)
            pulse_time = np.arange(count) / SAMPLE_RATE
            envelope = np.sin(np.linspace(0, np.pi, count)) ** 2
            chirp_pitch = base_pitch + pulse_index * 55
            chirp = np.sin(2 * np.pi * chirp_pitch * pulse_time) * envelope * 0.028
            add_event(track, chirp, cluster_start + pulse_index * 0.19)
    for start in (7.4, 16.4):
        count = int(1.05 * SAMPLE_RATE)
        page = fade_event(periodic_noise(rng, 350, 3_800, slope=0.45)[:count] * 0.019, 0.2, 0.48)
        add_event(track, page, start)
    return track


def make_loop_safe(track: np.ndarray) -> np.ndarray:
    crossfade = int(SAMPLE_RATE * 1.2)
    start = track[:crossfade].copy()
    end = track[-crossfade:].copy()
    fade = np.linspace(0, 1, crossfade)
    blend = start * fade + end * (1 - fade)
    track[:crossfade] = blend
    track[-crossfade:] = blend
    track -= np.mean(track)
    peak = np.max(np.abs(track))
    if peak > 0:
        track = track / peak * 0.72
    return np.clip(track, -1, 1)


def write_wav(path: Path, track: np.ndarray) -> None:
    pcm = (make_loop_safe(track) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generators = [
        ("01-black-white-tavern-v1.wav", create_tavern),
        ("02-carved-interior-v1.wav", create_interior),
        ("03-painted-pillow-night-v1.wav", create_night),
    ]
    for index, (filename, generator) in enumerate(generators, start=1):
        rng = np.random.default_rng(20260811 + index)
        path = OUTPUT_DIR / filename
        write_wav(path, generator(rng))
        print(f"{filename}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
