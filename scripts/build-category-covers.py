"""Original vector illustrations shipped with the site; no remote image dependency."""
from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'media/categories'
root.mkdir(parents=True, exist_ok=True)
art = {
'general': ('#14366b', '#70c9ff', '<path d="M115 72q55-22 85 5 35-27 85-5v110q-50-20-85 3-35-23-85-3z" fill="#fff2ce"/><path d="M200 78v106M130 96l48 6m-48 18 48 6m-48 18 48 6m44-48 48-6m-48 30 48-6m-48 30 48-6"/>'),
'geography': ('#0d5557','#65ded1','<circle cx="200" cy="125" r="75" fill="#72d5ed"/><path d="m150 64 38 12 2 28-28 20-24-18zm74 47 40-18 8 44-31 22-13 34-22-30z" fill="#389c6e"/><ellipse cx="200" cy="125" rx="38" ry="75"/><path d="M126 125h148M142 82h116M142 168h116"/>'),
'history': ('#633a33','#f4c28c','<path d="M150 48h100m-100 150h100M158 48c0 50 42 46 42 76s-42 26-42 74m84-150c0 50-42 46-42 76s42 26 42 74"/><path d="m171 79 29 36 29-36zm-5 110 34-39 34 39" fill="#f8cd77"/><path d="M136 48h128M136 198h128" stroke-width="12"/>'),
'islamic': ('#194c43','#b3e3a2','<path d="M125 180h165v-65h-35q0-44-48-66-48 22-48 66h-34z" fill="#e6d6a1"/><path d="M103 180V75h22v105m-25-107 14-30 14 30M197 180v-38a12 12 0 0 1 24 0v38"/><path d="M229 30a19 19 0 1 0 23 23 24 24 0 0 1-23-23" fill="#ffd877"/>'),
'riddles': ('#51307b','#d0a5fa','<path d="M146 179v-42h-26v-44h42c-10-36 42-36 32 0h40v36c36-10 36 42 0 32v40h-42v-22z" fill="#d9baff"/><path d="M175 126q0-21 22-19t11 29l-12 9v7m0 16h1" stroke="#623285" stroke-width="8"/>'),
'sports': ('#204d36','#a6e896','<circle cx="200" cy="124" r="73" fill="#f6f8ed"/><path d="m200 96 27 20-10 32h-34l-10-32z" fill="#23374a"/><path d="m200 51 0 45m69 7-42 13m16 68-26-36m-60 36 26-36m-52-45 42 13" stroke="#23374a" stroke-width="7"/>'),
'image-fruits': ('#79472c','#ffca84','<path d="M209 84c-22-28-65-20-65 25 0 54 35 79 57 63 28 21 63-17 63-65 0-40-35-52-55-23" fill="#f06c60"/><path d="M205 85q-10-39 20-51m-16 28q16-34 47-17-13 31-47 17" fill="#81bb62"/><path d="M165 105q-8 20 4 39" stroke="#ffb4a0" stroke-width="10"/>'),
'image-landmarks': ('#2b4870','#b3d0f4','<path d="M147 193h106m-82-40h58M197 43h6l12 74 38 76h-30l-23-48-23 48h-30l38-76z" fill="#edc088"/><path d="M174 138h52m-41-21h30m-22-24h14M130 193h140"/>'),
'image-animals': ('#57462e','#e7cc90','<circle cx="200" cy="128" r="77" fill="#ad743d"/><circle cx="151" cy="76" r="21" fill="#eac58c"/><circle cx="249" cy="76" r="21" fill="#eac58c"/><circle cx="200" cy="127" r="57" fill="#f6d598"/><circle cx="180" cy="118" r="5" fill="#303044"/><circle cx="220" cy="118" r="5" fill="#303044"/><path d="m190 139 10 10 10-10zm10 10v14m-20-2q20 20 40 0" stroke="#63432a"/>'),
'image-flags': ('#303b74','#bfc7ff','<path d="M135 194V50m0 10q35-23 70-5t64 0v100q-30 18-64 0t-70 5" fill="#f4f0df"/><path d="M138 62q33-20 67-3t62 0v32q-32 18-62 0t-67 3" fill="#e26767"/><path d="M138 127q33-20 67-3t62 0v28q-32 18-62 0t-67 3" fill="#50a886"/>'),
'symbols': ('#49336c','#c9b3ff','<rect x="107" y="79" width="64" height="76" rx="14" fill="#ffda83"/><circle cx="253" cy="117" r="39" fill="#b0cfff"/><path d="M191 108v24m-12-12h24m38-17 24 28m0-28-24 28" stroke="#5d3d80" stroke-width="8"/><path d="m163 184 37 17 37-17"/>'),
'bab-al-hara': ('#493b32','#e3b981','<path d="M90 204V57h220v147" fill="#c9ae86"/><path d="M143 204V121a57 57 0 0 1 114 0v83" fill="#3e5051"/><path d="M161 204v-79a39 39 0 0 1 78 0v79" fill="#9b603e"/><path d="M200 87v117m-29-87v85m58-85v85M92 82h48m120 0h48M92 111h37m142 0h37M92 146h37m142 0h37M92 178h37m142 0h37" stroke="#735744"/><circle cx="189" cy="157" r="5" fill="#ffd580"/><circle cx="211" cy="157" r="5" fill="#ffd580"/><path d="M112 28v25m-12-13h24m164-12v25m-12-13h24" stroke="#f6cf83"/>')
}
for name,(bg,accent,body) in art.items():
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><defs><radialGradient id="g"><stop stop-color="{accent}" stop-opacity=".28"/><stop offset="1" stop-color="{bg}"/></radialGradient></defs><path fill="{bg}" d="M0 0h400v250H0z"/><path fill="url(#g)" d="M0 0h400v250H0z"/><circle cx="340" cy="40" r="65" fill="{accent}" opacity=".08"/><circle cx="50" cy="230" r="80" fill="{accent}" opacity=".08"/><g fill="none" stroke="{accent}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">{body}</g></svg>'
    (root/f'fc-{name}.svg').write_text(svg,encoding='utf-8')
print('Created 12 original category illustrations')
