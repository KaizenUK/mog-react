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

export const schemaTypes = [
  seo,

  // Singletons / global
  siteSettings,
  vrmToolSettings, //Vehicle Reg look up

  // Core content
  sector,
  service,
  product,
  technicalDocument,

  // Blog/news
  post,
  author,
  category,
  blockContent,
]
