import { eventHandler } from "h3"
import { randomUUID } from "node:crypto"

export default eventHandler( async ( event ) => {
  event.context.requestId = randomUUID()
  event.context.__start = performance.now()
} )
