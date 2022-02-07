import * as bodyParser from 'body-parser'

export default function jsonParser({ limit = '100kb', type = '*/json', inflate = true, strict = true } = {}) {
    return bodyParser.json({ limit, inflate, strict, type })
}
