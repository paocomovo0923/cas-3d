# Worklog

---
Task ID: 1
Agent: main (Super Z)
Task: Desenvolver sistema CAS (Create-A-Sim) 3D inspirado em The Sims 4 com Three.js/Next.js — morph targets faciais, animações F_/M_ dos GLBs enviados, UI completa (perfil, catálogo, edição direta por hotspots).

Work Log:
- Carregou skill `fullstack-dev` e inicializou ambiente (curl init-fullstack.sh).
- Inspecionou os 4 arquivos enviados (`scripts/inspect_gltf.js`, `scripts/inspect_rigs.js`):
  - `avakin_anims_female.glb`: rig `female01_rig` (ossos mixamorig:*) + 12 clips F_*
  - `avakin_anims_male.glb`: rig `male01_rig` + 12 clips M_*
  - `Neutral Idle.gltf` / `Talking.gltf`: rig `Armature` com clip `Armature|mixamo.com|Layer0`, porém com buffers externos (.bin) NÃO enviados → loader falha graciosamente (clips extras opcionais).
  - GLBs contêm APENAS esqueleto + animações (sem meshes/materiais).
- Instalou `three@0.186.1` + `@types/three`; copiou assets para `public/models/`.
- Arquitetura implementada (modular, em `src/lib/cas/`):
  - `types.ts` — tipos compartilhados (Gender, CameraMode, MorphDef, CharacterLook…)
  - `morphs.ts` — 24 morph targets com chaves EXATAS da spec (formato_da_cabeca, cabeca_largura, cabeca_altura, queixo, queixo_x/y, bochecha*, mandibula_*, nariz*, nariz_asa_*, nariz_dorso, orelha_grande/pontuda/colada, ombro) + geradores de morph por região (smoothstep)
  - `skinning.ts` — skinning automático por distância a segmentos ósseos, com filtro por grupo de ossos e índice GLOBAL via skeleton (normBone para nomes sanitizados pelo GLTFLoader)
  - `geometryKit.ts` — cápsulas entre ossos, espelhamento com correção de winding/morphs, attachWorldAligned (fixação rígida alinhada ao mundo no bind), latheTorso, PROPORTIONS
  - `character.ts` — CASCharacter: converte rig Object3D→Bone, recentraliza, orienta +Z, cria mesh names da spec (torso__torso_skin, torso__torso_skin.001, legs__legs_skinmeshAction, head__head_001_oval/101, ears__ears_001_basic/.001, nariz__nariz_base), rosto procedural (olhos/íris/pupilas/sobrancelhas/boca), morphs, look, idades (escala), headWorldPos
  - `animation.ts` — AnimationController com crossfade suave (fadeOut/crossFadeTo), registerClip para extras
  - `catalog.ts` — 6 categorias (Cabelos/Tops/Baixos/Corpo Inteiro/Acessórios/Óculos) + paletas + construtores (cabelos 6 estilos, roupas skinned overlay, óculos 3 estilos, acessórios)
  - `engine.ts` — cena estúdio (DirectionalLight key com sombras VSM + fill + rim + hemi), plataforma circular, plumbob flutuante, OrbitControls, câmeras Full Body/Detail com tween exponencial, carregamento com progresso, hotspots integrados
  - `hotspots.ts` — 6 hotspots raycast no rosto (nariz, queixo, bochecha, mandíbula, orelha, cabeça) com drag → morphTargetInfluences
  - `voice.ts` — síntese "Simlish" (WebAudio) controlada pelo slider de tom de voz
- UI (`src/components/cas/`): TopBar (gênero, modos de câmera, aleatório), ProfilePanel (nome "Hello, My Name Is...", 6 idades com ícones, estilo de caminhada, tom de voz + teste, hexágonos de aspiração/3 traços + dados, tom de pele/olhos), FacePanel (sliders agrupados por grupo de morphs), CatalogPanel (grade + swatches), BottomBar (chips de animação F_/M_ + extras), Hexagon (clip-path).
- `src/app/page.tsx` → CASApp; metadata atualizada.

Bugs encontrados e corrigidos durante verificação com agent-browser:
1. GLTFLoader sanitiza nomes ("mixamorig:Hips"→"mixamorigHips") → `normBone()` para todas as comparações.
2. Rigs sem skin → nós não são THREE.Bone → `convertRigToBones()` reconstrói hierarquia como Bones.
3. playAnim não resolvia prefixo de gênero ('idle'→'F_idle') → resolução automática.
4. Malhas do corpo eram THREE.Mesh (não SkinnedMesh) → não deformavam → convertidas.
5. **skinIndex com índice LOCAL da lista filtrada em vez do índice GLOBAL do skeleton** → applySkinWeights agora mapeia bone.uuid→índice global.
6. **SkinnedMesh.bind() sem bindMatrix recalcula calculateInverses() com a pose corrente** (garments corrompiam o bind compartilhado) → bind com Matrix4 identidade explícita.
7. attachWorldAligned usava matrixWorld STALE de pais recém-criados (feições flutuando 1,5 m acima) → parent.updateWorldMatrix(true,false).
8. Rig do Blender virado para -X → rig.rotation.y = π/2 no build.
9. Cabelo longo/médio cobria o rosto (phi range da esfera) → abertura voltada para +Z.
10. Feições internas ao crânio (olhos/sobrancelhas/boca) → reposicionadas na superfície.
11. Câmera detail/fullbody reenquadrada; mangas ajustadas.

Stage Summary:
- Aplicação CAS 3D 100% funcional em `/` (Next.js 16 + three r186).
- Animações F_idle/F_walking/F_running/F_jump/strafes/turns tocando com crossfade; extras Neutral/Talking carregam se .bin existir.
- Morfologia facial reativa (sliders + drag nos hotspots), catálogo com cores, gêneros F/M, 6 idades, randomizador, voz Simlish.
- Verificado via agent-browser: 0 erros de console em load limpo; interações (gênero, catálogo, sliders, drag de hotspot, randomize, idade, chips de animação) todas funcionais.
- Screenshots de validação em `/home/z/my-project/download/cas_*.png`.

---
Task ID: 2
Agent: main (Super Z)
Task: Redesenhar a GUI do CAS para o estilo The Sims 4 (referência: screenshot CAS enviado pelo usuário) — fundo azul→verde saturado, cartões flutuantes compactos, menu circular de categorias, painel "Roupa do Dia", setas de rotação e botões ✕/✓.

Work Log:
- engine.ts: adicionados `rotateCharacter(delta)` (gira o Sim ativo) e `zoomCamera(delta)` (dolly da câmera com clamp nos limites do OrbitControls).
- hex.tsx: hexágonos reestilizados (aspiração dourada #ffd966→#f0b23e, traços branco-gelo, painel azul #1d5287).
- NOVO GarmentThumb.tsx: silhuetas SVG por item do catálogo (cabelos curto/médio/longo/coque/rabo, camiseta/regata/moletom, calça/shorts/saia, vestido/macacão, brincos/colar/boné, óculos redondo/quadrado/escuro) preenchidas com cor da paleta.
- NOVO CategoryOrbit.tsx: menu circular em arco com 7 categorias (Rosto & Pele + 6 do catálogo), círculos brancos 48px, ativo verde #3fae52 com anel branco, tooltip azul no hover.
- NOVO IdentityStack.tsx (topo-esquerdo): cartão "Hello, My Name Is…" (nome+sobrenome em #e2f2ff, toggle ♀/♂) + painel azul #1d5287/92 com hexágonos, dado de sorteio, 6 idades e select de estilo de caminhada.
- NOVO ProportionWidget.tsx (esquerda): sliders verticais customizados (tom de voz, velocidade da animação 0.5–1.6 via setWalkSpeedStyle), zoom +/− e botão de voz Simlish.
- NOVO RotationDock.tsx (base central): setas curvas brancas de rotação 360° + chips de animação (scroll no mobile, largura ajustada p/ não colidir com ✕/✓).
- NOVO panels/OutfitPanel.tsx: painel "Roupa do Dia" — cabeçalho da categoria, abas circulares (6 categorias), dropdown azul-claro com o tipo atual, grade 2×N com GarmentThumb + badge ✓ verde, swatches no rodapé. CatalogPanel.tsx removido.
- FacePanel.tsx: ganhou swatches de tom de pele e cor dos olhos (opcional) + aviso reestilizado na paleta azul.
- CASApp.tsx reescrito: fundo linear-gradient(to top right, #2b73b5, #3a989e, #4cb185) + vinheta, TopBar/BottomBar removidos, controles de câmera/dado no topo-direito, retrato do Sim (plumbob + nome + idade) na base-esquerda, botões ✕ (reset c/ toast) e ✓ (salva PNG via snapshot()) na base-direita, toast inline, mobile com chip de nome + Sheets (Perfil/Catálogo).
- next.config.ts: devIndicators: false (indicador "N" sobrepunha o retrato).
- character.ts: guards de null em morphTargetInfluences (typecheck).

Stage Summary:
- GUI 100% no estilo The Sims 4 CAS, validada por screenshots em 1600×900 e 390×844 (cas_gui_v2_*.png em download/).
- Todas as interações testadas via agent-browser sem erros de console: troca de gênero, vestido aplicado, rotação ±30°, modo detalhes (zoom facial + sliders + hotspots), seleção de item/swatch, animação Andando, ✕ reset e ✓ download do retrato.
- Typecheck limpo (excluindo erros pré-existentes em examples/ e skills/).
