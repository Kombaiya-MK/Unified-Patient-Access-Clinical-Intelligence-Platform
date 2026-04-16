import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{useMDXComponents as i}from"./index-CHKtz2QT.js";import{M as d}from"./index-DzduXL2Z.js";import{T as r,S as o}from"./TokenTable-z_Tf7GmE.js";import"./index-BWu4c2F4.js";import"./iframe-CECvfZkS.js";import"./index-DlVbWVVj.js";import"./index-4adcsI43.js";import"./index-DrFu-skq.js";function l(a){const s={code:"code",h1:"h1",h2:"h2",hr:"hr",p:"p",pre:"pre",...i(),...a.components};return e.jsxs(e.Fragment,{children:[e.jsx(d,{title:"Design Tokens/Docs/Shadows"}),`
`,e.jsx(s.h1,{id:"shadows--elevation",children:"Shadows & Elevation"}),`
`,e.jsx(s.p,{children:"Progressive shadow depth for visual hierarchy. Higher levels indicate elements closer to the user in z-space."}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"elevation-scale",children:"Elevation Scale"}),`
`,e.jsx(r,{tokens:[{name:"Level 0",cssVar:"--shadow-level-0",scssVar:"$shadow-level-0",value:"none",description:"Inline elements – no elevation"},{name:"Level 1",cssVar:"--shadow-level-1",scssVar:"$shadow-level-1",value:"0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)",description:"Subtle – cards, list items"},{name:"Level 2",cssVar:"--shadow-level-2",scssVar:"$shadow-level-2",value:"0px 3px 6px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.12)",description:"Medium – dropdowns, popovers"},{name:"Level 3",cssVar:"--shadow-level-3",scssVar:"$shadow-level-3",value:"0px 10px 20px rgba(0,0,0,0.15), 0px 3px 6px rgba(0,0,0,0.10)",description:"Prominent – modals, drawers"},{name:"Level 4",cssVar:"--shadow-level-4",scssVar:"$shadow-level-4",value:"0px 15px 25px rgba(0,0,0,0.15), 0px 5px 10px rgba(0,0,0,0.05)",description:"High – tooltips on modals"},{name:"Level 5",cssVar:"--shadow-level-5",scssVar:"$shadow-level-5",value:"0px 20px 40px rgba(0,0,0,0.2)",description:"Maximum – critical alerts"}],renderExample:n=>e.jsx(o,{shadow:n.value})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"special-shadows",children:"Special Shadows"}),`
`,e.jsx(r,{tokens:[{name:"Focus Ring",cssVar:"--shadow-focus-ring",scssVar:"$shadow-focus-ring",value:"0 0 0 2px #FFF, 0 0 0 4px #0066CC",description:"Keyboard focus indicator"},{name:"Button Active",cssVar:"--shadow-button-active",scssVar:"$shadow-button-active",value:"inset 0px 2px 4px rgba(0,0,0,0.2)",description:"Button pressed state"}],renderExample:n=>e.jsx(o,{shadow:n.value})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"elevation-guidelines",children:"Elevation Guidelines"}),`
`,e.jsx(s.p,{children:`| Level | z-index Range | Use Case |\r
|-------|--------------|----------|\r
| 0 | 0 | Inline elements, no elevation needed |\r
| 1 | 1–10 | Cards, list items, subtle elevation |\r
| 2 | 10–100 | Dropdowns, popovers, menus |\r
| 3 | 100–1000 | Modals, drawers, overlays |\r
| 4 | 1000–5000 | Tooltips stacked on modals |\r
| 5 | 5000+ | Critical alerts, emergency banners |`}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(s.pre,{children:e.jsx(s.code,{className:"language-css",children:`/* CSS Custom Property */\r
.card {\r
  box-shadow: var(--shadow-level-1);\r
}\r
\r
.modal {\r
  box-shadow: var(--shadow-level-3);\r
}\r
\r
.interactive:focus-visible {\r
  box-shadow: var(--shadow-focus-ring);\r
}
`})}),`
`,e.jsx(s.pre,{children:e.jsx(s.code,{className:"language-scss",children:`// SCSS Variable\r
.card {\r
  box-shadow: $shadow-level-1;\r
}\r
\r
.modal {\r
  box-shadow: $shadow-level-3;\r
}
`})})]})}function g(a={}){const{wrapper:s}={...i(),...a.components};return s?e.jsx(s,{...a,children:e.jsx(l,{...a})}):l(a)}const j=[];export{j as __namedExportsOrder,g as default};
