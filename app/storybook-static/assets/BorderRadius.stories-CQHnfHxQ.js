import{j as r}from"./jsx-runtime-BjG_zV1W.js";import{useMDXComponents as n}from"./index-CHKtz2QT.js";import{M as i}from"./index-DzduXL2Z.js";import{T as o,R as u}from"./TokenTable-z_Tf7GmE.js";import"./index-BWu4c2F4.js";import"./iframe-CECvfZkS.js";import"./index-DlVbWVVj.js";import"./index-4adcsI43.js";import"./index-DrFu-skq.js";function e(a){const s={code:"code",h1:"h1",h2:"h2",hr:"hr",p:"p",pre:"pre",...n(),...a.components};return r.jsxs(r.Fragment,{children:[r.jsx(i,{title:"Design Tokens/Docs/Border Radius"}),`
`,r.jsx(s.h1,{id:"border-radius",children:"Border Radius"}),`
`,r.jsxs(s.p,{children:["Border radius tokens control corner rounding across the UI. The default (",r.jsx(s.code,{children:"md"}),") is used for buttons, inputs, and cards."]}),`
`,r.jsx(s.hr,{}),`
`,r.jsx(s.h2,{id:"radius-scale",children:"Radius Scale"}),`
`,r.jsx(o,{tokens:[{name:"None",cssVar:"--radius-none",scssVar:"$radius-none",value:"0px",description:"No radius – tables, dividers"},{name:"SM",cssVar:"--radius-sm",scssVar:"$radius-sm",value:"4px",description:"Small – badges, tags, chips"},{name:"MD (default)",cssVar:"--radius-md",scssVar:"$radius-md",value:"8px",description:"Medium – buttons, inputs, cards"},{name:"LG",cssVar:"--radius-lg",scssVar:"$radius-lg",value:"12px",description:"Large – modals, drawers"},{name:"XL",cssVar:"--radius-xl",scssVar:"$radius-xl",value:"16px",description:"Extra large – featured cards, hero sections"},{name:"Full",cssVar:"--radius-full",scssVar:"$radius-full",value:"9999px",description:"Fully rounded – avatars, pills"}],renderExample:d=>r.jsx(u,{radius:d.value})}),`
`,r.jsx(s.hr,{}),`
`,r.jsx(s.h2,{id:"usage",children:"Usage"}),`
`,r.jsx(s.pre,{children:r.jsx(s.code,{className:"language-css",children:`/* CSS Custom Property */\r
.card {\r
  border-radius: var(--radius-md);\r
}\r
\r
.avatar {\r
  border-radius: var(--radius-full);\r
}
`})}),`
`,r.jsx(s.pre,{children:r.jsx(s.code,{className:"language-scss",children:`// SCSS Variable\r
.card {\r
  border-radius: $radius-md;\r
}\r
\r
.avatar {\r
  border-radius: $radius-full;\r
}
`})})]})}function g(a={}){const{wrapper:s}={...n(),...a.components};return s?r.jsx(s,{...a,children:r.jsx(e,{...a})}):e(a)}const v=[];export{v as __namedExportsOrder,g as default};
