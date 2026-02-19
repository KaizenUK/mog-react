//PLEASE DON'T DELETE COMMENTS FROM THE ARRAYS //
import {seo} from './objects/seo'

import author from './author'
import blockContent from './blockContent'
import category from './category'
import post from './post'

import {product} from './product'
import {technicalDocument} from './technicalDocument'
import {sector} from './sector'
import {service} from './service'
import {siteSettings} from './siteSettings'
import {vrmToolSettings} from './vrmToolSettings'
import { sitePage } from "./sitePage";


export const schemaTypes = [
  seo, 

// Singletons / global
siteSettings,      //Global site settings (header/footer, defaults)
vrmToolSettings,   //Vehicle Reg look up (tool copy/settings)

// Pages (Astro static pages: editable fields + SEO)
sitePage,          //Dynamic text/sections for static Astro pages (NOT a page builder)

// Core content
sector,            //Sector landing pages (Sectors-first IA)
service,           //Services content (service pages)
product,           //Products (list + /product/[slug])
technicalDocument, //PDF library (TDS/SDS/etc) + product linking

// Blog/news
post,              //News articles (formerly /blog; canonical /news)
author,            //News authors
category,          //News categories/taxonomy
blockContent,      //Portable Text blocks (shared rich content)
]
