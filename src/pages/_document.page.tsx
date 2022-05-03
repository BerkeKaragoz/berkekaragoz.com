import Document, {
   DocumentContext,
   Head,
   Html,
   Main,
   NextScript,
} from "next/document"

class MyDocument extends Document {
   static getInitialProps = async (ctx: DocumentContext) => {
      const initialProps = await Document.getInitialProps(ctx)

      return initialProps
   }

   render = () => (
      <Html>
         <Head />
         <body>
            <Main />
            <NextScript />
         </body>
      </Html>
   )
}

export default MyDocument
