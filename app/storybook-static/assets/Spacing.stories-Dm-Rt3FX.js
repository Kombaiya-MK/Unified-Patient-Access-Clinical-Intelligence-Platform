import{j as s}from"./jsx-runtime-BjG_zV1W.js";import{useMDXComponents as c}from"./index-CHKtz2QT.js";import{M as t}from"./index-DzduXL2Z.js";import{T as i,a as o}from"./TokenTable-z_Tf7GmE.js";import"./index-BWu4c2F4.js";import"./iframe-CECvfZkS.js";import"./index-DlVbWVVj.js";import"./index-4adcsI43.js";import"./index-DrFu-skq.js";function r(e){const a={code:"code",div:"div",h1:"h1",h2:"h2",hr:"hr",p:"p",pre:"pre",strong:"strong",...c(),...e.components};return s.jsxs(s.Fragment,{children:[s.jsx(t,{title:"Design Tokens/Docs/Spacing"}),`
`,s.jsx(a.h1,{id:"spacing-scale",children:"Spacing Scale"}),`
`,s.jsxs(a.p,{children:["All spacing tokens follow a ",s.jsx(a.strong,{children:"4px base grid"})," for consistent visual rhythm across the clinical interface."]}),`
`,s.jsx(a.hr,{}),`
`,s.jsx(a.h2,{id:"spacing-tokens",children:"Spacing Tokens"}),`
`,s.jsx(i,{tokens:[{name:"xs",cssVar:"--spacing-xs",scssVar:"$spacing-xs",value:"4px",description:"Compact – badge padding, icon margin"},{name:"sm",cssVar:"--spacing-sm",scssVar:"$spacing-sm",value:"8px",description:"Small – button padding, list items"},{name:"md",cssVar:"--spacing-md",scssVar:"$spacing-md",value:"12px",description:"Medium – card padding, form field margin"},{name:"base",cssVar:"--spacing-base",scssVar:"$spacing-base",value:"16px",description:"Default – section margin, card content"},{name:"lg",cssVar:"--spacing-lg",scssVar:"$spacing-lg",value:"24px",description:"Large – section gaps, modal padding"},{name:"xl",cssVar:"--spacing-xl",scssVar:"$spacing-xl",value:"32px",description:"Extra large – page padding"},{name:"2xl",cssVar:"--spacing-2xl",scssVar:"$spacing-2xl",value:"48px",description:"Page header margin"},{name:"3xl",cssVar:"--spacing-3xl",scssVar:"$spacing-3xl",value:"64px",description:"Hero sections"},{name:"4xl",cssVar:"--spacing-4xl",scssVar:"$spacing-4xl",value:"96px",description:"Rare, large page margins"}],renderExample:n=>s.jsx(o,{size:n.value})}),`
`,s.jsx(a.hr,{}),`
`,s.jsx(a.h2,{id:"component-sizes",children:"Component Sizes"}),`
`,s.jsx(i,{tokens:[{name:"Button SM",cssVar:"--size-button-sm",scssVar:"$size-button-sm",value:"32px",description:"Small button height"},{name:"Button MD",cssVar:"--size-button-md",scssVar:"$size-button-md",value:"40px",description:"Medium button height (default)"},{name:"Button LG",cssVar:"--size-button-lg",scssVar:"$size-button-lg",value:"48px",description:"Large button height"},{name:"Input Height",cssVar:"--size-input-height",scssVar:"$size-input-height",value:"44px",description:"Default input height"},{name:"Icon SM",cssVar:"--size-icon-sm",scssVar:"$size-icon-sm",value:"16px"},{name:"Icon MD",cssVar:"--size-icon-md",scssVar:"$size-icon-md",value:"20px"},{name:"Icon LG",cssVar:"--size-icon-lg",scssVar:"$size-icon-lg",value:"24px"}],renderExample:n=>s.jsx(a.div,{style:{width:n.value,height:n.value,backgroundColor:"#CCE0F5",borderRadius:"4px",border:"1px dashed #0066CC"}})}),`
`,s.jsx(a.hr,{}),`
`,s.jsx(a.h2,{id:"breakpoints",children:"Breakpoints"}),`
`,s.jsx(i,{tokens:[{name:"Mobile",cssVar:"--breakpoint-mobile",scssVar:"$breakpoint-mobile",value:"320px"},{name:"Tablet",cssVar:"--breakpoint-tablet",scssVar:"$breakpoint-tablet",value:"768px"},{name:"Desktop",cssVar:"--breakpoint-desktop",scssVar:"$breakpoint-desktop",value:"1024px"},{name:"Wide",cssVar:"--breakpoint-wide",scssVar:"$breakpoint-wide",value:"1441px"}],renderExample:n=>s.jsx(a.div,{style:{width:`${Math.min(parseInt(n.value,10)/10,120)}px`,height:"16px",backgroundColor:"#66A3E0",borderRadius:"3px"}})}),`
`,s.jsx(a.hr,{}),`
`,s.jsx(a.h2,{id:"usage",children:"Usage"}),`
`,s.jsx(a.pre,{children:s.jsx(a.code,{className:"language-css",children:`/* CSS Custom Property */\r
.card {\r
  padding: var(--spacing-lg);\r
  margin-bottom: var(--spacing-base);\r
  gap: var(--spacing-sm);\r
}
`})}),`
`,s.jsx(a.pre,{children:s.jsx(a.code,{className:"language-scss",children:`// SCSS Variable\r
.card {\r
  padding: $spacing-lg;\r
  margin-bottom: $spacing-base;\r
  gap: $spacing-sm;\r
}
`})})]})}function V(e={}){const{wrapper:a}={...c(),...e.components};return a?s.jsx(a,{...e,children:s.jsx(r,{...e})}):r(e)}const v=[];export{v as __namedExportsOrder,V as default};
