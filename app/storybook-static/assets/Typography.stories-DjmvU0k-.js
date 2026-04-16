import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{useMDXComponents as p}from"./index-CHKtz2QT.js";import{M as o}from"./index-DzduXL2Z.js";import{T as n,b as r}from"./TokenTable-z_Tf7GmE.js";import"./index-BWu4c2F4.js";import"./iframe-CECvfZkS.js";import"./index-DlVbWVVj.js";import"./index-4adcsI43.js";import"./index-DrFu-skq.js";function i(t){const s={code:"code",div:"div",h1:"h1",h2:"h2",hr:"hr",p:"p",pre:"pre",span:"span",strong:"strong",...p(),...t.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Design Tokens/Docs/Typography"}),`
`,e.jsx(s.h1,{id:"typography",children:"Typography"}),`
`,e.jsxs(s.p,{children:["Typography tokens built on the ",e.jsx(s.strong,{children:"Inter"})," typeface for optimal screen readability in clinical interfaces."]}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"font-families",children:"Font Families"}),`
`,e.jsx(n,{tokens:[{name:"Heading",cssVar:"--typography-font-family-heading",scssVar:"$typography-font-family-heading",value:"Inter, system, sans-serif",description:"Headings and titles"},{name:"Body",cssVar:"--typography-font-family-body",scssVar:"$typography-font-family-body",value:"Inter, system, sans-serif",description:"Body text and UI elements"},{name:"Mono",cssVar:"--typography-font-family-mono",scssVar:"$typography-font-family-mono",value:"Fira Code, Consolas, monospace",description:"Code and data values"}],renderExample:a=>e.jsx(r,{fontFamily:`var(${a.cssVar})`,text:"Aa Bb Cc 123"})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"font-sizes",children:"Font Sizes"}),`
`,e.jsx(n,{tokens:[{name:"xs (12px)",cssVar:"--typography-font-size-xs",scssVar:"$typography-font-size-xs",value:"12px",description:"Caption, helper text"},{name:"sm (14px)",cssVar:"--typography-font-size-sm",scssVar:"$typography-font-size-sm",value:"14px",description:"Body small, table cells, labels"},{name:"base (16px)",cssVar:"--typography-font-size-base",scssVar:"$typography-font-size-base",value:"16px",description:"Default body, form inputs"},{name:"lg (18px)",cssVar:"--typography-font-size-lg",scssVar:"$typography-font-size-lg",value:"18px",description:"Body large, H4"},{name:"xl (20px)",cssVar:"--typography-font-size-xl",scssVar:"$typography-font-size-xl",value:"20px",description:"H3"},{name:"2xl (24px)",cssVar:"--typography-font-size-2xl",scssVar:"$typography-font-size-2xl",value:"24px",description:"H2"},{name:"3xl (32px)",cssVar:"--typography-font-size-3xl",scssVar:"$typography-font-size-3xl",value:"32px",description:"H1, page titles"},{name:"4xl (48px)",cssVar:"--typography-font-size-4xl",scssVar:"$typography-font-size-4xl",value:"48px",description:"Display large"}],renderExample:a=>e.jsx(r,{fontSize:a.value,text:"Patient Record"})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"font-weights",children:"Font Weights"}),`
`,e.jsx(n,{tokens:[{name:"Regular",cssVar:"--typography-font-weight-regular",scssVar:"$typography-font-weight-regular",value:"400",description:"Body text"},{name:"Medium",cssVar:"--typography-font-weight-medium",scssVar:"$typography-font-weight-medium",value:"500",description:"Labels, emphasis"},{name:"Semibold",cssVar:"--typography-font-weight-semibold",scssVar:"$typography-font-weight-semibold",value:"600",description:"Headings"},{name:"Bold",cssVar:"--typography-font-weight-bold",scssVar:"$typography-font-weight-bold",value:"700",description:"Display, H1"}],renderExample:a=>e.jsx(r,{fontWeight:a.value,fontSize:"18px",text:"Appointment Scheduled"})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"line-heights",children:"Line Heights"}),`
`,e.jsx(n,{tokens:[{name:"Tight",cssVar:"--typography-line-height-tight",scssVar:"$typography-line-height-tight",value:"1.2",description:"Display headings"},{name:"Snug",cssVar:"--typography-line-height-snug",scssVar:"$typography-line-height-snug",value:"1.25",description:"H1"},{name:"Normal",cssVar:"--typography-line-height-normal",scssVar:"$typography-line-height-normal",value:"1.33",description:"H2, H4, caption"},{name:"Relaxed",cssVar:"--typography-line-height-relaxed",scssVar:"$typography-line-height-relaxed",value:"1.43",description:"H3, body small"},{name:"Loose",cssVar:"--typography-line-height-loose",scssVar:"$typography-line-height-loose",value:"1.5",description:"H5, body medium"},{name:"Spacious",cssVar:"--typography-line-height-spacious",scssVar:"$typography-line-height-spacious",value:"1.56",description:"Body large"},{name:"Extra",cssVar:"--typography-line-height-extra",scssVar:"$typography-line-height-extra",value:"1.8",description:"Loose reading"}],renderExample:a=>e.jsx(s.div,{style:{lineHeight:a.value,fontSize:"13px",width:"160px",background:"#E6F0FA",padding:"4px 6px",borderRadius:"4px"},children:"Multi-line text sample for line height"})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"letter-spacing",children:"Letter Spacing"}),`
`,e.jsx(n,{tokens:[{name:"Tight",cssVar:"--typography-letter-spacing-tight",scssVar:"$typography-letter-spacing-tight",value:"-0.5px",description:"Display headings"},{name:"Snug",cssVar:"--typography-letter-spacing-snug",scssVar:"$typography-letter-spacing-snug",value:"-0.25px",description:"H1"},{name:"Normal",cssVar:"--typography-letter-spacing-normal",scssVar:"$typography-letter-spacing-normal",value:"0px",description:"Default"},{name:"Wide",cssVar:"--typography-letter-spacing-wide",scssVar:"$typography-letter-spacing-wide",value:"0.1px",description:"Labels"},{name:"Wider",cssVar:"--typography-letter-spacing-wider",scssVar:"$typography-letter-spacing-wider",value:"0.18px",description:"Body text"},{name:"Widest",cssVar:"--typography-letter-spacing-widest",scssVar:"$typography-letter-spacing-widest",value:"1px",description:"Overline / uppercase"}],renderExample:a=>e.jsx(s.span,{style:{letterSpacing:a.value,fontSize:"15px"},children:"Clinical Dashboard"})}),`
`,e.jsx(s.hr,{}),`
`,e.jsx(s.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(s.pre,{children:e.jsx(s.code,{className:"language-css",children:`/* CSS Custom Property */\r
.heading {\r
  font-family: var(--typography-font-family-heading);\r
  font-size: var(--typography-font-size-3xl);\r
  font-weight: var(--typography-font-weight-bold);\r
  line-height: var(--typography-line-height-snug);\r
}
`})}),`
`,e.jsx(s.pre,{children:e.jsx(s.code,{className:"language-scss",children:`// SCSS Variable\r
.heading {\r
  font-family: $typography-font-family-heading;\r
  font-size: $typography-font-size-3xl;\r
  font-weight: $typography-font-weight-bold;\r
  line-height: $typography-line-height-snug;\r
}
`})})]})}function u(t={}){const{wrapper:s}={...p(),...t.components};return s?e.jsx(s,{...t,children:e.jsx(i,{...t})}):i(t)}const V=[];export{V as __namedExportsOrder,u as default};
