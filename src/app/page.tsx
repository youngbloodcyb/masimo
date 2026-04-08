"use client";

import InfiniteGrid from "@/components/infinite-grid";
import {
  Acorn,
  Alien,
  Anchor,
  Aperture,
  Atom,
  Balloon,
  Barbell,
  BeerBottle,
  Bicycle,
  Binoculars,
  Bird,
  Boat,
  Bone,
  Radio,
  Butterfly,
  Cactus,
  Camera,
  Campfire,
  Cat,
  Cloud,
  Compass,
  Cookie,
  Crown,
  CurrencyBtc,
  Diamond,
  Dog,
  Eyeglasses,
  Fire,
  FishSimple,
  Flame,
  FlowerLotus,
  GameController,
  Ghost,
  Gift,
  Globe,
  Guitar,
  Hamburger,
  Headphones,
  Heart,
  Horse,
  HourglassSimple,
  IceCream,
  Island,
  Key,
  Leaf,
  Lightbulb,
  Lightning,
  MagicWand,
  MagnifyingGlass,
  Moon,
  Mountains,
  MusicNote,
  Palette,
  PaperPlaneTilt,
  PawPrint,
  Peace,
  Pill,
  Pizza,
  Planet,
  Plant,
  PuzzlePiece,
  Rocket,
  Scissors,
  Skull,
  Smiley,
  Snowflake,
  Star,
  SunHorizon,
  Sword,
  Target,
  Tent,
  Tree,
  Trophy,
  Umbrella,
  Virus,
  WaveSawtooth,
  Wind,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

const ICONS: Icon[] = [
  Acorn, Alien, Anchor, Aperture, Atom, Balloon, Barbell, BeerBottle,
  Bicycle, Binoculars, Bird, Boat, Bone, Radio, Butterfly, Cactus,
  Camera, Campfire, Cat, Cloud, Compass, Cookie, Crown, CurrencyBtc,
  Diamond, Dog, Eyeglasses, Fire, FishSimple, Flame, FlowerLotus,
  GameController, Ghost, Gift, Globe, Guitar, Hamburger, Headphones,
  Heart, Horse, HourglassSimple, IceCream, Island, Key, Leaf, Lightbulb,
  Lightning, MagicWand, MagnifyingGlass, Moon, Mountains, MusicNote,
  Palette, PaperPlaneTilt, PawPrint, Peace, Pill, Pizza, Planet, Plant,
  PuzzlePiece, Rocket, Scissors, Skull, Smiley, Snowflake, Star, SunHorizon,
  Sword, Target, Tent, Tree, Trophy, Umbrella, Virus, WaveSawtooth, Wind,
];

// Simple hash to get a deterministic but varied icon per grid index
function iconForIndex(index: number): Icon {
  // Mix bits so adjacent indices don't get adjacent icons
  let h = index ^ 0xdeadbeef;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return ICONS[h % ICONS.length];
}

export default function Home() {
  return (
    <div className="relative w-screen h-screen bg-zinc-950">
      <InfiniteGrid
        gridSize={120}
        renderItem={({ gridIndex }) => {
          const IconComponent = iconForIndex(gridIndex);
          return (
            <div className="flex items-center justify-center w-full h-full">
              <IconComponent size={48} weight="duotone" className="text-zinc-400" />
            </div>
          );
        }}
      />
    </div>
  );
}
