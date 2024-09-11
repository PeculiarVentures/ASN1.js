"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[8401],{6716:(e,n,t)=>{t.r(n),t.d(n,{default:()=>_n});var i=t(6540),s=t(1003),a=t(9532),l=t(4848);const o=i.createContext(null);function r(e){let{children:n,content:t}=e;const s=function(e){return(0,i.useMemo)((()=>({metadata:e.metadata,frontMatter:e.frontMatter,assets:e.assets,contentTitle:e.contentTitle,toc:e.toc})),[e])}(t);return(0,l.jsx)(o.Provider,{value:s,children:n})}function c(){const e=(0,i.useContext)(o);if(null===e)throw new a.dV("DocProvider");return e}function d(){const{metadata:e,frontMatter:n,assets:t}=c();return(0,l.jsx)(s.be,{title:e.title,description:e.description,keywords:n.keywords,image:t.image??n.image})}var u=t(8215),m=t(4581),h=t(1312),x=t(8774);function f(e){const{permalink:n,title:t,subLabel:i,isNext:s}=e;return(0,l.jsxs)(x.A,{className:(0,u.A)("pagination-nav__link",s?"pagination-nav__link--next":"pagination-nav__link--prev"),to:n,children:[i&&(0,l.jsx)("div",{className:"pagination-nav__sublabel",children:i}),(0,l.jsx)("div",{className:"pagination-nav__label",children:t})]})}function p(e){const{previous:n,next:t}=e;return(0,l.jsxs)("nav",{className:"pagination-nav docusaurus-mt-lg","aria-label":(0,h.T)({id:"theme.docs.paginator.navAriaLabel",message:"Docs pages",description:"The ARIA label for the docs pagination"}),children:[n&&(0,l.jsx)(f,{...n,subLabel:(0,l.jsx)(h.A,{id:"theme.docs.paginator.previous",description:"The label used to navigate to the previous doc",children:"Previous"})}),t&&(0,l.jsx)(f,{...t,subLabel:(0,l.jsx)(h.A,{id:"theme.docs.paginator.next",description:"The label used to navigate to the next doc",children:"Next"}),isNext:!0})]})}function v(){const{metadata:e}=c();return(0,l.jsx)(p,{previous:e.previous,next:e.next})}var j=t(4586),g=t(4070),b=t(7559),A=t(3886),N=t(3025);const C={unreleased:function(e){let{siteTitle:n,versionMetadata:t}=e;return(0,l.jsx)(h.A,{id:"theme.docs.versions.unreleasedVersionLabel",description:"The label used to tell the user that he's browsing an unreleased doc version",values:{siteTitle:n,versionLabel:(0,l.jsx)("b",{children:t.label})},children:"This is unreleased documentation for {siteTitle} {versionLabel} version."})},unmaintained:function(e){let{siteTitle:n,versionMetadata:t}=e;return(0,l.jsx)(h.A,{id:"theme.docs.versions.unmaintainedVersionLabel",description:"The label used to tell the user that he's browsing an unmaintained doc version",values:{siteTitle:n,versionLabel:(0,l.jsx)("b",{children:t.label})},children:"This is documentation for {siteTitle} {versionLabel}, which is no longer actively maintained."})}};function L(e){const n=C[e.versionMetadata.banner];return(0,l.jsx)(n,{...e})}function _(e){let{versionLabel:n,to:t,onClick:i}=e;return(0,l.jsx)(h.A,{id:"theme.docs.versions.latestVersionSuggestionLabel",description:"The label used to tell the user to check the latest version",values:{versionLabel:n,latestVersionLink:(0,l.jsx)("b",{children:(0,l.jsx)(x.A,{to:t,onClick:i,children:(0,l.jsx)(h.A,{id:"theme.docs.versions.latestVersionLinkLabel",description:"The label used for the latest version suggestion link label",children:"latest version"})})})},children:"For up-to-date documentation, see the {latestVersionLink} ({versionLabel})."})}function T(e){let{className:n,versionMetadata:t}=e;const{siteConfig:{title:i}}=(0,j.A)(),{pluginId:s}=(0,g.vT)({failfast:!0}),{savePreferredVersionName:a}=(0,A.g1)(s),{latestDocSuggestion:o,latestVersionSuggestion:r}=(0,g.HW)(s),c=o??(d=r).docs.find((e=>e.id===d.mainDocId));var d;return(0,l.jsxs)("div",{className:(0,u.A)(n,b.G.docs.docVersionBanner,"alert alert--warning margin-bottom--md"),role:"alert",children:[(0,l.jsx)("div",{children:(0,l.jsx)(L,{siteTitle:i,versionMetadata:t})}),(0,l.jsx)("div",{className:"margin-top--md",children:(0,l.jsx)(_,{versionLabel:r.label,to:c.path,onClick:()=>a(r.name)})})]})}function y(e){let{className:n}=e;const t=(0,N.r)();return t.banner?(0,l.jsx)(T,{className:n,versionMetadata:t}):null}function k(e){let{className:n}=e;const t=(0,N.r)();return t.badge?(0,l.jsx)("span",{className:(0,u.A)(n,b.G.docs.docVersionBadge,"badge badge--secondary"),children:(0,l.jsx)(h.A,{id:"theme.docs.versionBadge.label",values:{versionLabel:t.label},children:"Version: {versionLabel}"})}):null}const w={tag:"tag_zVej",tagRegular:"tagRegular_sFm0",tagWithCount:"tagWithCount_h2kH"};function H(e){let{permalink:n,label:t,count:i,description:s}=e;return(0,l.jsxs)(x.A,{href:n,title:s,className:(0,u.A)(w.tag,i?w.tagWithCount:w.tagRegular),children:[t,i&&(0,l.jsx)("span",{children:i})]})}const M={tags:"tags_jXut",tag:"tag_QGVx"};function B(e){let{tags:n}=e;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("b",{children:(0,l.jsx)(h.A,{id:"theme.tags.tagsListLabel",description:"The label alongside a tag list",children:"Tags:"})}),(0,l.jsx)("ul",{className:(0,u.A)(M.tags,"padding--none","margin-left--sm"),children:n.map((e=>(0,l.jsx)("li",{className:M.tag,children:(0,l.jsx)(H,{...e})},e.permalink)))})]})}const U={iconEdit:"iconEdit_Z9Sw"};function E(e){let{className:n,...t}=e;return(0,l.jsx)("svg",{fill:"currentColor",height:"20",width:"20",viewBox:"0 0 40 40",className:(0,u.A)(U.iconEdit,n),"aria-hidden":"true",...t,children:(0,l.jsx)("g",{children:(0,l.jsx)("path",{d:"m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"})})})}function I(e){let{editUrl:n}=e;return(0,l.jsxs)(x.A,{to:n,className:b.G.common.editThisPage,children:[(0,l.jsx)(E,{}),(0,l.jsx)(h.A,{id:"theme.common.editThisPage",description:"The link label to edit the current page",children:"Edit this page"})]})}function V(e){void 0===e&&(e={});const{i18n:{currentLocale:n}}=(0,j.A)(),t=function(){const{i18n:{currentLocale:e,localeConfigs:n}}=(0,j.A)();return n[e].calendar}();return new Intl.DateTimeFormat(n,{calendar:t,...e})}function z(e){let{lastUpdatedAt:n}=e;const t=new Date(n),i=V({day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(t);return(0,l.jsx)(h.A,{id:"theme.lastUpdated.atDate",description:"The words used to describe on which date a page has been last updated",values:{date:(0,l.jsx)("b",{children:(0,l.jsx)("time",{dateTime:t.toISOString(),itemProp:"dateModified",children:i})})},children:" on {date}"})}function S(e){let{lastUpdatedBy:n}=e;return(0,l.jsx)(h.A,{id:"theme.lastUpdated.byUser",description:"The words used to describe by who the page has been last updated",values:{user:(0,l.jsx)("b",{children:n})},children:" by {user}"})}function R(e){let{lastUpdatedAt:n,lastUpdatedBy:t}=e;return(0,l.jsxs)("span",{className:b.G.common.lastUpdated,children:[(0,l.jsx)(h.A,{id:"theme.lastUpdated.lastUpdatedAtBy",description:"The sentence used to display when a page has been last updated, and by who",values:{atDate:n?(0,l.jsx)(z,{lastUpdatedAt:n}):"",byUser:t?(0,l.jsx)(S,{lastUpdatedBy:t}):""},children:"Last updated{atDate}{byUser}"}),!1]})}const D={lastUpdated:"lastUpdated_JAkA"};function G(e){let{className:n,editUrl:t,lastUpdatedAt:i,lastUpdatedBy:s}=e;return(0,l.jsxs)("div",{className:(0,u.A)("row",n),children:[(0,l.jsx)("div",{className:"col",children:t&&(0,l.jsx)(I,{editUrl:t})}),(0,l.jsx)("div",{className:(0,u.A)("col",D.lastUpdated),children:(i||s)&&(0,l.jsx)(R,{lastUpdatedAt:i,lastUpdatedBy:s})})]})}function O(){const{metadata:e}=c(),{editUrl:n,lastUpdatedAt:t,lastUpdatedBy:i,tags:s}=e,a=s.length>0,o=!!(n||t||i);return a||o?(0,l.jsxs)("footer",{className:(0,u.A)(b.G.docs.docFooter,"docusaurus-mt-lg"),children:[a&&(0,l.jsx)("div",{className:(0,u.A)("row margin-top--sm",b.G.docs.docFooterTagsRow),children:(0,l.jsx)("div",{className:"col",children:(0,l.jsx)(B,{tags:s})})}),o&&(0,l.jsx)(G,{className:(0,u.A)("margin-top--sm",b.G.docs.docFooterEditMetaRow),editUrl:n,lastUpdatedAt:t,lastUpdatedBy:i})]}):null}var F=t(1422),P=t(6342);function q(e){const n=e.map((e=>({...e,parentIndex:-1,children:[]}))),t=Array(7).fill(-1);n.forEach(((e,n)=>{const i=t.slice(2,e.level);e.parentIndex=Math.max(...i),t[e.level]=n}));const i=[];return n.forEach((e=>{const{parentIndex:t,...s}=e;t>=0?n[t].children.push(s):i.push(s)})),i}function W(e){let{toc:n,minHeadingLevel:t,maxHeadingLevel:i}=e;return n.flatMap((e=>{const n=W({toc:e.children,minHeadingLevel:t,maxHeadingLevel:i});return function(e){return e.level>=t&&e.level<=i}(e)?[{...e,children:n}]:n}))}function $(e){const n=e.getBoundingClientRect();return n.top===n.bottom?$(e.parentNode):n}function Z(e,n){let{anchorTopOffset:t}=n;const i=e.find((e=>$(e).top>=t));if(i){return function(e){return e.top>0&&e.bottom<window.innerHeight/2}($(i))?i:e[e.indexOf(i)-1]??null}return e[e.length-1]??null}function J(){const e=(0,i.useRef)(0),{navbar:{hideOnScroll:n}}=(0,P.p)();return(0,i.useEffect)((()=>{e.current=n?0:document.querySelector(".navbar").clientHeight}),[n]),e}function Y(e){const n=(0,i.useRef)(void 0),t=J();(0,i.useEffect)((()=>{if(!e)return()=>{};const{linkClassName:i,linkActiveClassName:s,minHeadingLevel:a,maxHeadingLevel:l}=e;function o(){const e=function(e){return Array.from(document.getElementsByClassName(e))}(i),o=function(e){let{minHeadingLevel:n,maxHeadingLevel:t}=e;const i=[];for(let s=n;s<=t;s+=1)i.push(`h${s}.anchor`);return Array.from(document.querySelectorAll(i.join()))}({minHeadingLevel:a,maxHeadingLevel:l}),r=Z(o,{anchorTopOffset:t.current}),c=e.find((e=>r&&r.id===function(e){return decodeURIComponent(e.href.substring(e.href.indexOf("#")+1))}(e)));e.forEach((e=>{!function(e,t){t?(n.current&&n.current!==e&&n.current.classList.remove(s),e.classList.add(s),n.current=e):e.classList.remove(s)}(e,e===c)}))}return document.addEventListener("scroll",o),document.addEventListener("resize",o),o(),()=>{document.removeEventListener("scroll",o),document.removeEventListener("resize",o)}}),[e,t])}function Q(e){let{toc:n,className:t,linkClassName:i,isChild:s}=e;return n.length?(0,l.jsx)("ul",{className:s?void 0:t,children:n.map((e=>(0,l.jsxs)("li",{children:[(0,l.jsx)(x.A,{to:`#${e.id}`,className:i??void 0,dangerouslySetInnerHTML:{__html:e.value}}),(0,l.jsx)(Q,{isChild:!0,toc:e.children,className:t,linkClassName:i})]},e.id)))}):null}const X=i.memo(Q);function K(e){let{toc:n,className:t="table-of-contents table-of-contents__left-border",linkClassName:s="table-of-contents__link",linkActiveClassName:a,minHeadingLevel:o,maxHeadingLevel:r,...c}=e;const d=(0,P.p)(),u=o??d.tableOfContents.minHeadingLevel,m=r??d.tableOfContents.maxHeadingLevel,h=function(e){let{toc:n,minHeadingLevel:t,maxHeadingLevel:s}=e;return(0,i.useMemo)((()=>W({toc:q(n),minHeadingLevel:t,maxHeadingLevel:s})),[n,t,s])}({toc:n,minHeadingLevel:u,maxHeadingLevel:m});return Y((0,i.useMemo)((()=>{if(s&&a)return{linkClassName:s,linkActiveClassName:a,minHeadingLevel:u,maxHeadingLevel:m}}),[s,a,u,m])),(0,l.jsx)(X,{toc:h,className:t,linkClassName:s,...c})}const ee={tocCollapsibleButton:"tocCollapsibleButton_TO0P",tocCollapsibleButtonExpanded:"tocCollapsibleButtonExpanded_MG3E"};function ne(e){let{collapsed:n,...t}=e;return(0,l.jsx)("button",{type:"button",...t,className:(0,u.A)("clean-btn",ee.tocCollapsibleButton,!n&&ee.tocCollapsibleButtonExpanded,t.className),children:(0,l.jsx)(h.A,{id:"theme.TOCCollapsible.toggleButtonLabel",description:"The label used by the button on the collapsible TOC component",children:"On this page"})})}const te={tocCollapsible:"tocCollapsible_ETCw",tocCollapsibleContent:"tocCollapsibleContent_vkbj",tocCollapsibleExpanded:"tocCollapsibleExpanded_sAul"};function ie(e){let{toc:n,className:t,minHeadingLevel:i,maxHeadingLevel:s}=e;const{collapsed:a,toggleCollapsed:o}=(0,F.u)({initialState:!0});return(0,l.jsxs)("div",{className:(0,u.A)(te.tocCollapsible,!a&&te.tocCollapsibleExpanded,t),children:[(0,l.jsx)(ne,{collapsed:a,onClick:o}),(0,l.jsx)(F.N,{lazy:!0,className:te.tocCollapsibleContent,collapsed:a,children:(0,l.jsx)(K,{toc:n,minHeadingLevel:i,maxHeadingLevel:s})})]})}const se={tocMobile:"tocMobile_ITEo"};function ae(){const{toc:e,frontMatter:n}=c();return(0,l.jsx)(ie,{toc:e,minHeadingLevel:n.toc_min_heading_level,maxHeadingLevel:n.toc_max_heading_level,className:(0,u.A)(b.G.docs.docTocMobile,se.tocMobile)})}const le={tableOfContents:"tableOfContents_bqdL",docItemContainer:"docItemContainer_F8PC"},oe="table-of-contents__link toc-highlight",re="table-of-contents__link--active";function ce(e){let{className:n,...t}=e;return(0,l.jsx)("div",{className:(0,u.A)(le.tableOfContents,"thin-scrollbar",n),children:(0,l.jsx)(K,{...t,linkClassName:oe,linkActiveClassName:re})})}function de(){const{toc:e,frontMatter:n}=c();return(0,l.jsx)(ce,{toc:e,minHeadingLevel:n.toc_min_heading_level,maxHeadingLevel:n.toc_max_heading_level,className:b.G.docs.docTocDesktop})}var ue=t(1107),me=t(8453),he=t(5260),xe=t(1432);function fe(e){return(0,l.jsx)("code",{...e})}var pe=t(5066),ve=t(3427),je=t(2303);const ge={details:"details_lb9f",isBrowser:"isBrowser_bmU9",collapsibleContent:"collapsibleContent_i85q"};function be(e){return!!e&&("SUMMARY"===e.tagName||be(e.parentElement))}function Ae(e,n){return!!e&&(e===n||Ae(e.parentElement,n))}function Ne(e){let{summary:n,children:t,...s}=e;(0,ve.A)().collectAnchor(s.id);const a=(0,je.A)(),o=(0,i.useRef)(null),{collapsed:r,setCollapsed:c}=(0,F.u)({initialState:!s.open}),[d,u]=(0,i.useState)(s.open),m=i.isValidElement(n)?n:(0,l.jsx)("summary",{children:n??"Details"});return(0,l.jsxs)("details",{...s,ref:o,open:d,"data-collapsed":r,className:(0,pe.A)(ge.details,a&&ge.isBrowser,s.className),onMouseDown:e=>{be(e.target)&&e.detail>1&&e.preventDefault()},onClick:e=>{e.stopPropagation();const n=e.target;be(n)&&Ae(n,o.current)&&(e.preventDefault(),r?(c(!1),u(!0)):c(!0))},children:[m,(0,l.jsx)(F.N,{lazy:!1,collapsed:r,disableSSRStyle:!0,onCollapseTransitionEnd:e=>{c(e),u(!e)},children:(0,l.jsx)("div",{className:ge.collapsibleContent,children:t})})]})}const Ce={details:"details_b_Ee"},Le="alert alert--info";function _e(e){let{...n}=e;return(0,l.jsx)(Ne,{...n,className:(0,u.A)(Le,Ce.details,n.className)})}function Te(e){const n=i.Children.toArray(e.children),t=n.find((e=>i.isValidElement(e)&&"summary"===e.type)),s=(0,l.jsx)(l.Fragment,{children:n.filter((e=>e!==t))});return(0,l.jsx)(_e,{...e,summary:t,children:s})}function ye(e){return(0,l.jsx)(ue.A,{...e})}const ke={containsTaskList:"containsTaskList_mC6p"};function we(e){if(void 0!==e)return(0,u.A)(e,e?.includes("contains-task-list")&&ke.containsTaskList)}const He={img:"img_ev3q"};function Me(e){const{mdxAdmonitionTitle:n,rest:t}=function(e){const n=i.Children.toArray(e),t=n.find((e=>i.isValidElement(e)&&"mdxAdmonitionTitle"===e.type)),s=n.filter((e=>e!==t)),a=t?.props.children;return{mdxAdmonitionTitle:a,rest:s.length>0?(0,l.jsx)(l.Fragment,{children:s}):null}}(e.children),s=e.title??n;return{...e,...s&&{title:s},children:t}}const Be={admonition:"admonition_xJq3",admonitionHeading:"admonitionHeading_Gvgb",admonitionIcon:"admonitionIcon_Rf37",admonitionContent:"admonitionContent_BuS1"};function Ue(e){let{type:n,className:t,children:i}=e;return(0,l.jsx)("div",{className:(0,u.A)(b.G.common.admonition,b.G.common.admonitionType(n),Be.admonition,t),children:i})}function Ee(e){let{icon:n,title:t}=e;return(0,l.jsxs)("div",{className:Be.admonitionHeading,children:[(0,l.jsx)("span",{className:Be.admonitionIcon,children:n}),t]})}function Ie(e){let{children:n}=e;return n?(0,l.jsx)("div",{className:Be.admonitionContent,children:n}):null}function Ve(e){const{type:n,icon:t,title:i,children:s,className:a}=e;return(0,l.jsxs)(Ue,{type:n,className:a,children:[i||t?(0,l.jsx)(Ee,{title:i,icon:t}):null,(0,l.jsx)(Ie,{children:s})]})}function ze(e){return(0,l.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,l.jsx)("path",{fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"})})}const Se={icon:(0,l.jsx)(ze,{}),title:(0,l.jsx)(h.A,{id:"theme.admonition.note",description:"The default label used for the Note admonition (:::note)",children:"note"})};function Re(e){return(0,l.jsx)(Ve,{...Se,...e,className:(0,u.A)("alert alert--secondary",e.className),children:e.children})}function De(e){return(0,l.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,l.jsx)("path",{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})})}const Ge={icon:(0,l.jsx)(De,{}),title:(0,l.jsx)(h.A,{id:"theme.admonition.tip",description:"The default label used for the Tip admonition (:::tip)",children:"tip"})};function Oe(e){return(0,l.jsx)(Ve,{...Ge,...e,className:(0,u.A)("alert alert--success",e.className),children:e.children})}function Fe(e){return(0,l.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,l.jsx)("path",{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})})}const Pe={icon:(0,l.jsx)(Fe,{}),title:(0,l.jsx)(h.A,{id:"theme.admonition.info",description:"The default label used for the Info admonition (:::info)",children:"info"})};function qe(e){return(0,l.jsx)(Ve,{...Pe,...e,className:(0,u.A)("alert alert--info",e.className),children:e.children})}function We(e){return(0,l.jsx)("svg",{viewBox:"0 0 16 16",...e,children:(0,l.jsx)("path",{fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"})})}const $e={icon:(0,l.jsx)(We,{}),title:(0,l.jsx)(h.A,{id:"theme.admonition.warning",description:"The default label used for the Warning admonition (:::warning)",children:"warning"})};function Ze(e){return(0,l.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,l.jsx)("path",{fillRule:"evenodd",d:"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"})})}const Je={icon:(0,l.jsx)(Ze,{}),title:(0,l.jsx)(h.A,{id:"theme.admonition.danger",description:"The default label used for the Danger admonition (:::danger)",children:"danger"})};const Ye={icon:(0,l.jsx)(We,{}),title:(0,l.jsx)(h.A,{id:"theme.admonition.caution",description:"The default label used for the Caution admonition (:::caution)",children:"caution"})};const Qe={...{note:Re,tip:Oe,info:qe,warning:function(e){return(0,l.jsx)(Ve,{...$e,...e,className:(0,u.A)("alert alert--warning",e.className),children:e.children})},danger:function(e){return(0,l.jsx)(Ve,{...Je,...e,className:(0,u.A)("alert alert--danger",e.className),children:e.children})}},...{secondary:e=>(0,l.jsx)(Re,{title:"secondary",...e}),important:e=>(0,l.jsx)(qe,{title:"important",...e}),success:e=>(0,l.jsx)(Oe,{title:"success",...e}),caution:function(e){return(0,l.jsx)(Ve,{...Ye,...e,className:(0,u.A)("alert alert--warning",e.className),children:e.children})}}};function Xe(e){const n=Me(e),t=(i=n.type,Qe[i]||(console.warn(`No admonition component found for admonition type "${i}". Using Info as fallback.`),Qe.info));var i;return(0,l.jsx)(t,{...n})}var Ke=t(418);const en={Head:he.A,details:Te,Details:Te,code:function(e){return function(e){return void 0!==e.children&&i.Children.toArray(e.children).every((e=>"string"==typeof e&&!e.includes("\n")))}(e)?(0,l.jsx)(fe,{...e}):(0,l.jsx)(xe.A,{...e})},a:function(e){return(0,l.jsx)(x.A,{...e})},pre:function(e){return(0,l.jsx)(l.Fragment,{children:e.children})},ul:function(e){return(0,l.jsx)("ul",{...e,className:we(e.className)})},li:function(e){return(0,ve.A)().collectAnchor(e.id),(0,l.jsx)("li",{...e})},img:function(e){return(0,l.jsx)("img",{decoding:"async",loading:"lazy",...e,className:(n=e.className,(0,u.A)(n,He.img))});var n},h1:e=>(0,l.jsx)(ye,{as:"h1",...e}),h2:e=>(0,l.jsx)(ye,{as:"h2",...e}),h3:e=>(0,l.jsx)(ye,{as:"h3",...e}),h4:e=>(0,l.jsx)(ye,{as:"h4",...e}),h5:e=>(0,l.jsx)(ye,{as:"h5",...e}),h6:e=>(0,l.jsx)(ye,{as:"h6",...e}),admonition:Xe,mermaid:Ke.A};function nn(e){let{children:n}=e;return(0,l.jsx)(me.x,{components:en,children:n})}function tn(e){let{children:n}=e;const t=function(){const{metadata:e,frontMatter:n,contentTitle:t}=c();return n.hide_title||void 0!==t?null:e.title}();return(0,l.jsxs)("div",{className:(0,u.A)(b.G.docs.docMarkdown,"markdown"),children:[t&&(0,l.jsx)("header",{children:(0,l.jsx)(ue.A,{as:"h1",children:t})}),(0,l.jsx)(nn,{children:n})]})}var sn=t(6972),an=t(9169),ln=t(6025);function on(e){return(0,l.jsx)("svg",{viewBox:"0 0 24 24",...e,children:(0,l.jsx)("path",{d:"M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z",fill:"currentColor"})})}const rn={breadcrumbHomeIcon:"breadcrumbHomeIcon_YNFT"};function cn(){const e=(0,ln.Ay)("/");return(0,l.jsx)("li",{className:"breadcrumbs__item",children:(0,l.jsx)(x.A,{"aria-label":(0,h.T)({id:"theme.docs.breadcrumbs.home",message:"Home page",description:"The ARIA label for the home page in the breadcrumbs"}),className:"breadcrumbs__link",href:e,children:(0,l.jsx)(on,{className:rn.breadcrumbHomeIcon})})})}const dn={breadcrumbsContainer:"breadcrumbsContainer_Z_bl"};function un(e){let{children:n,href:t,isLast:i}=e;const s="breadcrumbs__link";return i?(0,l.jsx)("span",{className:s,itemProp:"name",children:n}):t?(0,l.jsx)(x.A,{className:s,href:t,itemProp:"item",children:(0,l.jsx)("span",{itemProp:"name",children:n})}):(0,l.jsx)("span",{className:s,children:n})}function mn(e){let{children:n,active:t,index:i,addMicrodata:s}=e;return(0,l.jsxs)("li",{...s&&{itemScope:!0,itemProp:"itemListElement",itemType:"https://schema.org/ListItem"},className:(0,u.A)("breadcrumbs__item",{"breadcrumbs__item--active":t}),children:[n,(0,l.jsx)("meta",{itemProp:"position",content:String(i+1)})]})}function hn(){const e=(0,sn.OF)(),n=(0,an.Dt)();return e?(0,l.jsx)("nav",{className:(0,u.A)(b.G.docs.docBreadcrumbs,dn.breadcrumbsContainer),"aria-label":(0,h.T)({id:"theme.docs.breadcrumbs.navAriaLabel",message:"Breadcrumbs",description:"The ARIA label for the breadcrumbs"}),children:(0,l.jsxs)("ul",{className:"breadcrumbs",itemScope:!0,itemType:"https://schema.org/BreadcrumbList",children:[n&&(0,l.jsx)(cn,{}),e.map(((n,t)=>{const i=t===e.length-1,s="category"===n.type&&n.linkUnlisted?void 0:n.href;return(0,l.jsx)(mn,{active:i,index:t,addMicrodata:!!s,children:(0,l.jsx)(un,{href:s,isLast:i,children:n.label})},t)}))]})}):null}function xn(){return(0,l.jsx)(h.A,{id:"theme.contentVisibility.unlistedBanner.title",description:"The unlisted content banner title",children:"Unlisted page"})}function fn(){return(0,l.jsx)(h.A,{id:"theme.contentVisibility.unlistedBanner.message",description:"The unlisted content banner message",children:"This page is unlisted. Search engines will not index it, and only users having a direct link can access it."})}function pn(){return(0,l.jsx)(he.A,{children:(0,l.jsx)("meta",{name:"robots",content:"noindex, nofollow"})})}function vn(){return(0,l.jsx)(h.A,{id:"theme.contentVisibility.draftBanner.title",description:"The draft content banner title",children:"Draft page"})}function jn(){return(0,l.jsx)(h.A,{id:"theme.contentVisibility.draftBanner.message",description:"The draft content banner message",children:"This page is a draft. It will only be visible in dev and be excluded from the production build."})}function gn(e){let{className:n}=e;return(0,l.jsx)(Xe,{type:"caution",title:(0,l.jsx)(vn,{}),className:(0,u.A)(n,b.G.common.draftBanner),children:(0,l.jsx)(jn,{})})}function bn(e){let{className:n}=e;return(0,l.jsx)(Xe,{type:"caution",title:(0,l.jsx)(xn,{}),className:(0,u.A)(n,b.G.common.unlistedBanner),children:(0,l.jsx)(fn,{})})}function An(e){return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(pn,{}),(0,l.jsx)(bn,{...e})]})}function Nn(e){let{metadata:n}=e;const{unlisted:t,frontMatter:i}=n;return(0,l.jsxs)(l.Fragment,{children:[(t||i.unlisted)&&(0,l.jsx)(An,{}),i.draft&&(0,l.jsx)(gn,{})]})}const Cn={docItemContainer:"docItemContainer_Djhp",docItemCol:"docItemCol_VOVn"};function Ln(e){let{children:n}=e;const t=function(){const{frontMatter:e,toc:n}=c(),t=(0,m.l)(),i=e.hide_table_of_contents,s=!i&&n.length>0;return{hidden:i,mobile:s?(0,l.jsx)(ae,{}):void 0,desktop:!s||"desktop"!==t&&"ssr"!==t?void 0:(0,l.jsx)(de,{})}}(),{metadata:i}=c();return(0,l.jsxs)("div",{className:"row",children:[(0,l.jsxs)("div",{className:(0,u.A)("col",!t.hidden&&Cn.docItemCol),children:[(0,l.jsx)(Nn,{metadata:i}),(0,l.jsx)(y,{}),(0,l.jsxs)("div",{className:Cn.docItemContainer,children:[(0,l.jsxs)("article",{children:[(0,l.jsx)(hn,{}),(0,l.jsx)(k,{}),t.mobile,(0,l.jsx)(tn,{children:n}),(0,l.jsx)(O,{})]}),(0,l.jsx)(v,{})]})]}),t.desktop&&(0,l.jsx)("div",{className:"col col--3",children:t.desktop})]})}function _n(e){const n=`docs-doc-id-${e.content.metadata.id}`,t=e.content;return(0,l.jsx)(r,{content:e.content,children:(0,l.jsxs)(s.e3,{className:n,children:[(0,l.jsx)(d,{}),(0,l.jsx)(Ln,{children:(0,l.jsx)(t,{})})]})})}}}]);