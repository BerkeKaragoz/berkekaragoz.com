import argparse
import asyncio
from pathlib import Path

import edge_tts


SAMPLES = {
    "p": ("pen", None),
    "b": ("bed", None),
    "t": ("tea", None),
    "d": ("day", None),
    "k": ("key", None),
    "g": ("go", None),
    "f": ("fan", None),
    "v": ("van", None),
    "theta": ("thin", None),
    "eth": ("then", None),
    "s": ("sip", None),
    "z": ("zip", None),
    "sh": ("ship", None),
    "zh": ("vision", None),
    "h": ("hat", None),
    "tsh": ("chin", None),
    "dzh": ("jam", None),
    "m": ("map", None),
    "n": ("nap", None),
    "ng": ("sing", None),
    "l": ("light", None),
    "r": ("red", None),
    "j": ("yes", None),
    "w": ("wet", None),
    "i-long": ("see", None),
    "i-short": ("sit", None),
    "e": ("bed", None),
    "ash": ("cat", None),
    "alpha-long": ("father", None),
    "lot": ("hot", None),
    "thought": ("thought", None),
    "foot": ("book", None),
    "u-long": ("blue", None),
    "strut": ("cup", None),
    "nurse": ("bird", None),
    "schwa": ("about", None),
    "face": ("say", "ay"),
    "price": ("my", "eye"),
    "choice": ("boy", "oy"),
    "goat": ("go", "oh"),
    "mouth": ("now", "ow"),
    "near": ("near", "ear"),
    "square": ("square", "air"),
    "cure": ("cure", "oo-uh"),
}


async def save_sample(text: str, destination: Path) -> None:
    communication = edge_tts.Communicate(
        text,
        voice="en-GB-SoniaNeural",
        rate="-18%",
    )
    await communication.save(str(destination))


async def main(output: Path, selected_ids: set[str] | None = None) -> None:
    words_path = output / "words"
    sounds_path = output / "sounds"
    words_path.mkdir(parents=True, exist_ok=True)
    sounds_path.mkdir(parents=True, exist_ok=True)

    semaphore = asyncio.Semaphore(4)

    async def limited_save(text: str, destination: Path) -> None:
        async with semaphore:
            await save_sample(text, destination)
            print(f"Generated {destination.name}")

    jobs = []
    for sample_id, (word, diphthong_cue) in SAMPLES.items():
        if selected_ids and sample_id not in selected_ids:
            continue

        jobs.append(limited_save(word, words_path / f"{sample_id}.mp3"))
        if diphthong_cue:
            jobs.append(
                limited_save(
                    diphthong_cue,
                    sounds_path / f"{sample_id}.mp3",
                )
            )

    await asyncio.gather(*jobs)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "output",
        nargs="?",
        default="public/audio/ipa/en-GB",
        type=Path,
    )
    parser.add_argument(
        "--ids",
        nargs="+",
        choices=sorted(SAMPLES),
        help="Regenerate only the selected sound IDs.",
    )
    arguments = parser.parse_args()
    asyncio.run(
        main(
            arguments.output.resolve(),
            set(arguments.ids) if arguments.ids else None,
        )
    )
