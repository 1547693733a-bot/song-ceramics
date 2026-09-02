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
    time = np.arange(SAMPLE_COUNT) / SAMPLE_RATE
    # A soft, low-frequency night breeze. The second band gives the wind a
    # little air movement without turning it into cloth rustle or room noise.
    low_wind = 0.022 * periodic_noise(rng, 20, 320, slope=2.0)
    air_wind = 0.0038 * periodic_noise(rng, 150, 900, slope=1.3)
    gust = (
        0.82
        + 0.1 * np.sin(2 * np.pi * time / 9.6 + 0.7)
        + 0.055 * np.sin(2 * np.pi * time / 4.1 + 2.2)
        + 0.025 * np.sin(2 * np.pi * time / 1.75 + 0.3)
    )
    track = (low_wind + air_wind) * np.clip(gust, 0.62, 1.08)

    def add_insect_chirp(
        start: float,
        duration: float,
        pitch: float,
        sweep: float,
        level: float,
        overtone: float = 0.28,
    ) -> None:
        count = max(1, int(duration * SAMPLE_RATE))
        pulse_time = np.arange(count) / SAMPLE_RATE
        normalized = pulse_time / max(duration, 1e-5)
        phase = 2 * np.pi * (pitch * pulse_time + 0.5 * sweep * pulse_time * normalized)
        envelope = np.sin(np.linspace(0, np.pi, count)) ** 3
        chirp = (np.sin(phase) + overtone * np.sin(phase * 2.03 + 0.6)) * envelope * level
        add_event(track, chirp, start)

    # Occasional soft calls from the near field. They are deliberately sparse
    # and lower-pitched so the sound reads as a rural yard, not dense jungle.
    for cluster_start in (1.4, 5.05, 8.95, 13.45, 17.85, 22.25):
        pulse_count = int(rng.integers(1, 4))
        base_pitch = float(rng.uniform(2_600, 3_700))
        cursor = cluster_start
        for pulse_index in range(pulse_count):
            duration = float(rng.uniform(0.12, 0.24))
            add_insect_chirp(
                cursor,
                duration,
                base_pitch + pulse_index * float(rng.uniform(28, 70)),
                float(rng.uniform(30, 160)),
                float(rng.uniform(0.01, 0.017)),
                overtone=0.14,
            )
            cursor += duration + float(rng.uniform(0.2, 0.42))

    # Distant crickets sit lower in the mix, with long gaps between calls.
    for cluster_start in (2.75, 7.15, 11.75, 16.15, 20.45):
        pulse_count = int(rng.integers(1, 4))
        base_pitch = float(rng.uniform(1_100, 1_900))
        cursor = cluster_start
        for _ in range(pulse_count):
            duration = float(rng.uniform(0.07, 0.13))
            add_insect_chirp(
                cursor,
                duration,
                base_pitch + float(rng.uniform(-55, 75)),
                float(rng.uniform(-45, 90)),
                float(rng.uniform(0.008, 0.014)),
                overtone=0.1,
            )
            cursor += duration + float(rng.uniform(0.24, 0.5))

    # Only a few muted mid-distance calls add depth without sharp treble.
    for start in (4.25, 10.15, 18.7):
        add_insect_chirp(
            start,
            float(rng.uniform(0.22, 0.38)),
            float(rng.uniform(2_200, 3_200)),
            float(rng.uniform(-160, 160)),
            float(rng.uniform(0.004, 0.008)),
            overtone=0.08,
        )
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
