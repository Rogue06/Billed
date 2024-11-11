/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// On simule (mock) le store
jest.mock("../app/store", () => mockStore);

// Test principal pour un employé connecté
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test de base fourni qu'on va compléter
    test("Then the new bill form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      // On vérifie que le formulaire est bien affiché
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    // Test pour la sélection d'un fichier
    describe("When I upload a file", () => {
      // Test pour un fichier valide
      test("Then the file handler should accept jpg/jpeg/png files", async () => {
        // Simulation du localStorage
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );

        // Création du DOM
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Création d'une instance de NewBill
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) =>
            (document.body.innerHTML = ROUTES({ pathname })),
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Simulation du fichier à uploader (format valide)
        const validFile = new File(["test"], "test.jpg", {
          type: "image/jpeg",
        });
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);

        // Simulation de l'upload
        fireEvent.change(fileInput, { target: { files: [validFile] } });

        expect(handleChangeFile).toHaveBeenCalled();
        expect(fileInput.files[0]).toEqual(validFile);
      });

      // Test pour un fichier invalide
      test("Then the file handler should show error message for invalid file type", async () => {
        // Simulation du localStorage
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );

        // Création du DOM
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Mock de window.alert
        global.alert = jest.fn();

        // Création d'une instance de NewBill
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) =>
            (document.body.innerHTML = ROUTES({ pathname })),
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Simulation du fichier à uploader (format invalide - PDF)
        const invalidFile = new File(["test"], "test.pdf", {
          type: "application/pdf",
        });
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const fileInput = screen.getByTestId("file");
        fileInput.addEventListener("change", handleChangeFile);

        // Simulation de l'upload
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });

        // Vérification que l'alerte a été appelée avec le bon message
        expect(global.alert).toHaveBeenCalledWith(
          "Veuillez télécharger un fichier avec une extension jpg, jpeg ou png."
        );

        // Vérification que le fichier n'a pas été traité
        expect(newBill.fileUrl).toBeNull();
        expect(newBill.fileName).toBeNull();
      });
    });

    // Test pour la soumission du formulaire
    describe("When I submit the form with valid data", () => {
      test("Then a new bill should be created", async () => {
        // Simulation du localStorage
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );

        // Création du DOM
        const html = NewBillUI();
        document.body.innerHTML = html;

        // Création d'une instance de NewBill
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) =>
            (document.body.innerHTML = ROUTES({ pathname })),
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Simulation des données du formulaire
        const formNewBill = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        formNewBill.addEventListener("submit", handleSubmit);

        // Remplissage du formulaire
        fireEvent.submit(formNewBill);

        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });
});
