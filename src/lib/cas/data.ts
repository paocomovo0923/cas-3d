/**
 * CAS — Dados da interface (aspirações, traços, idades, estilos de caminhada)
 */
import {
  Activity,
  BookOpen,
  Brain,
  Compass,
  Coins,
  CookingPot,
  Crosshair,
  Gamepad2,
  GraduationCap,
  Heart,
  Home,
  Moon,
  Music,
  Palette,
  Smile,
  Star,
  TrendingUp,
  Trophy,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { AgeId, WalkStyleDef } from './types';

export interface AspirationDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface TraitDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const ASPIRATIONS: AspirationDef[] = [
  { id: 'fama', label: 'Fama', icon: Star },
  { id: 'fortuna', label: 'Fortuna', icon: Coins },
  { id: 'amor', label: 'Amor', icon: Heart },
  { id: 'conhecimento', label: 'Conhecimento', icon: GraduationCap },
  { id: 'aventura', label: 'Aventura', icon: Compass },
  { id: 'criacao', label: 'Criação', icon: Palette },
  { id: 'familia', label: 'Família', icon: Home },
  { id: 'atletismo', label: 'Atletismo', icon: Trophy },
  { id: 'popularidade', label: 'Popularidade', icon: Users },
  { id: 'culinaria', label: 'Culinária', icon: CookingPot },
];

export const TRAITS: TraitDef[] = [
  { id: 'ativo', label: 'Ativo', icon: Activity },
  { id: 'criativo', label: 'Criativo', icon: Palette },
  { id: 'genial', label: 'Gênio', icon: Brain },
  { id: 'alegre', label: 'Alegre', icon: Smile },
  { id: 'solitario', label: 'Solitário', icon: Moon },
  { id: 'ambicioso', label: 'Ambicioso', icon: TrendingUp },
  { id: 'brincalhao', label: 'Brincalhão', icon: Gamepad2 },
  { id: 'leitor', label: 'Leitor Voraz', icon: BookOpen },
  { id: 'comilao', label: 'Comilão', icon: UtensilsCrossed },
  { id: 'romantico', label: 'Romântico', icon: Heart },
  { id: 'perfeccionista', label: 'Perfeccionista', icon: Crosshair },
  { id: 'musical', label: 'Amante de Música', icon: Music },
];

export const AGES: { id: AgeId; label: string }[] = [
  { id: 'bebe', label: 'Bebê' },
  { id: 'crianca', label: 'Criança' },
  { id: 'adolescente', label: 'Adolescente' },
  { id: 'jovem_adulto', label: 'Jovem Adulto' },
  { id: 'adulto', label: 'Adulto' },
  { id: 'idoso', label: 'Idoso' },
];

export const WALK_STYLES: WalkStyleDef[] = [
  { id: 'padrao', label: 'Padrão', clip: { F: 'walking', M: 'walking' }, speed: 1 },
  { id: 'apressado', label: 'Apressado (correndo)', clip: { F: 'running', M: 'running' }, speed: 1 },
  { id: 'lateral_esq', label: 'Passo Lateral Esquerdo', clip: { F: 'left_strafe_walk', M: 'left_strafe_walk' }, speed: 1 },
  { id: 'lateral_dir', label: 'Passo Lateral Direito', clip: { F: 'right_strafe_walk', M: 'right_strafe_walk' }, speed: 1 },
];

export interface PreviewAnim {
  id: string;
  label: string;
  extra?: boolean;
}

export const PREVIEW_ANIMS: PreviewAnim[] = [
  { id: 'idle', label: 'Parado' },
  { id: 'walking', label: 'Andando' },
  { id: 'running', label: 'Correndo' },
  { id: 'jump', label: 'Pulando' },
  { id: 'left_strafe', label: '⇠ Strafe' },
  { id: 'right_strafe', label: 'Strafe ⇢' },
  { id: 'left_turn', label: '↺ Virar' },
  { id: 'right_turn', label: '↻ Virar' },
  { id: 'neutral_idle', label: 'Neutro', extra: true },
  { id: 'talking', label: 'Falando', extra: true },
];

export function randomPick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}
