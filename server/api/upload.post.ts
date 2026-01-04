import { uploadImageToCloudinary } from "~~/server/utils/cloudinary"

export default defineEventHandler( async ( event ) => {
    const form = await readMultipartFormData( event )
    const file = form?.find( ( f ) => f.name === "file" )

    if ( !file ) {
        throw createError( { statusCode: 400, statusMessage: "Tidak ada file yang diunggah." } )
    }

    await requireRole( event, ["admin", "super-admin"] )

    const url = await uploadImageToCloudinary( {
        data     : file.data,
        type     : file.type,
        filename : file.filename,
    }, { folder: "sempurna-baja", maxBytes: 2 * 1024 * 1024 } )

    return { url }
} )
