// // pages/ja/success.tsx

// import { GetStaticProps } from "next";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// export const getStaticProps: GetStaticProps = async ({ locale }) => {
//   return {
//     props: {
//       ...(await serverSideTranslations(locale ?? "ja", ["common"])),
//     },
//   };
// };

import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function SuccessPage() {
  return (
    <div>
      Success Page (ja)
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};
