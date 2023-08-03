import styles from "../styles/styles.module.scss";

export default function FormCard({ children, currentStep, prevFormStep }) {
  return (
    <div className="bg-gray-200  border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-600 dark:border-gray-200 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      {currentStep < 6 && (
        <>
          <span className={styles.steps}>
            <div className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
              Paso {currentStep + 1} de 6
            </div>
          </span>
          {currentStep > 0 && (
            <button
            className="mt-2 mb-5 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_5px_5px_rgba(177,155,0,0.75)]  border-orange-800 hover:bg-orange-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-orange-400/50 dark:to-orange-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(255,155,0,0.25)]  dark:border-orange-200 dark:hover:bg-orange-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full"

              // className="mb-10 hover:bg-gray-300 dark:hover:bg-gray-90 bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onClick={prevFormStep}
              type="button"
            >
              Volver
            </button>
          )}
        </>
      )}
      {children}
    </div>
  );
}
