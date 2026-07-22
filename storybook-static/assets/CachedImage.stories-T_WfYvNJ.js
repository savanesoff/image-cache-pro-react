import{o as e}from"./preload-helper-B8fgDhjS.js";import{a as t,f as n,i as r,n as i,s as a,t as o,u as s}from"./provider-B2iJL3yb.js";var c,l,u,d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{a(),r(),o(),c=n(),_={title:`CachedImage`,component:t,decorators:[e=>(0,c.jsx)(i,{ram:200,video:60,units:`MB`,loaders:4,children:(0,c.jsx)(s,{name:`storybook`,children:(0,c.jsx)(e,{})})})],args:{url:`https://picsum.photos/seed/storybook/640/360`,width:320,height:180},argTypes:{fit:{control:`radio`,options:[`fill`,`cover`,`contain`]}}},v={},y={args:{url:`https://picsum.photos/seed/cover/800/600`,fit:`cover`}},b={args:{children:(0,c.jsx)(`div`,{style:{width:`64px`,height:`20px`,background:`#ff7a00`,color:`#fff`,fontFamily:`sans-serif`,fontSize:`12px`,lineHeight:`20px`,textAlign:`center`},children:`LIVE`})}},x={render:e=>(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(`style`,{children:`
        .fade-poster { opacity: 0.35; transition: opacity 300ms ease-out; }
        .fade-poster[data-state='rendered'] { opacity: 1; }
      `}),(0,c.jsx)(t,{...e,className:`fade-poster`})]}),args:{url:`https://picsum.photos/seed/fade/640/360`}},v.parameters={...v.parameters,docs:{...(l=v.parameters)==null?void 0:l.docs,source:{originalSource:`{}`,...(u=v.parameters)==null||(u=u.docs)==null?void 0:u.source}}},y.parameters={...y.parameters,docs:{...(d=y.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    url: 'https://picsum.photos/seed/cover/800/600',
    fit: 'cover'
  }
}`,...(f=y.parameters)==null||(f=f.docs)==null?void 0:f.source}}},b.parameters={...b.parameters,docs:{...(p=b.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    children: <div style={{
      width: '64px',
      height: '20px',
      background: '#ff7a00',
      color: '#fff',
      fontFamily: 'sans-serif',
      fontSize: '12px',
      lineHeight: '20px',
      textAlign: 'center'
    }}>
        LIVE
      </div>
  }
}`,...(m=b.parameters)==null||(m=m.docs)==null?void 0:m.source}}},x.parameters={...x.parameters,docs:{...(h=x.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: args => <>
      <style>{\`
        .fade-poster { opacity: 0.35; transition: opacity 300ms ease-out; }
        .fade-poster[data-state='rendered'] { opacity: 1; }
      \`}</style>
      <CachedImage {...args} className="fade-poster" />
    </>,
  args: {
    url: 'https://picsum.photos/seed/fade/640/360'
  }
}`,...(g=x.parameters)==null||(g=g.docs)==null?void 0:g.source}}},S=[`Basic`,`CoverFit`,`WithOverlay`,`FadeInViaDataState`]}))();export{v as Basic,y as CoverFit,x as FadeInViaDataState,b as WithOverlay,S as __namedExportsOrder,_ as default};