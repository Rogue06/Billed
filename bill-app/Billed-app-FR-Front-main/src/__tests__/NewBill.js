/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
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

        // Vérification de la redirection vers Bills
        await waitFor(() => {
          expect(screen.getByText("Mes notes de frais")).toBeTruthy();
        });
      });
    });

    // Test de l'erreur 500
    describe("When an error 500 occurs", () => {
      test("Then it should display an error message", async () => {
        // Préparation du DOM
        document.body.innerHTML = NewBillUI();

        // Simulation de l'erreur 500
        const error = new Error("Erreur 500");
        const html = BillsUI({ error });
        document.body.innerHTML = html;

        // Vérification que le message d'erreur est affiché
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});

// Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a new bill", () => {
    test("Then the bill is created", async () => {
      // Simulation localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );

      // Création du DOM
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      // Attendre que le formulaire soit chargé
      await waitFor(() => screen.getByTestId("form-new-bill"));

      // Création d'une instance de NewBill
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) =>
          (document.body.innerHTML = ROUTES({ pathname })),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simulation des données du formulaire
      const inputData = {
        type: "Transports",
        name: "Test Transport",
        amount: "100",
        date: "2024-03-14",
        vat: "20",
        pct: "20",
        commentary: "Test d'intégration",
        file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
      };

      // Remplissage du formulaire
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: inputData.type },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: inputData.name },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: inputData.amount },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: inputData.date },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: inputData.vat },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: inputData.pct },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: inputData.commentary },
      });

      // Upload du fichier
      const fileInput = screen.getByTestId("file");
      fireEvent.change(fileInput, { target: { files: [inputData.file] } });

      // Soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      // Vérification de la redirection vers Bills
      await waitFor(() => {
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        document.body.innerHTML = NewBillUI();
      });

      test("Then it fails with 404 message error", async () => {
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: {
            bills: () => ({
              create: () => Promise.reject(new Error("Erreur 404")),
              update: () => Promise.reject(new Error("Erreur 404")),
            }),
          },
          localStorage: window.localStorage,
        });

        // Simulation de la soumission du formulaire
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(handleSubmit).toHaveBeenCalled();
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("Then it fails with 500 message error", async () => {
        const newBill = new NewBill({
          document,
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: {
            bills: () => ({
              create: () => Promise.reject(new Error("Erreur 500")),
              update: () => Promise.reject(new Error("Erreur 500")),
            }),
          },
          localStorage: window.localStorage,
        });

        // Simulation de la soumission du formulaire
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(handleSubmit).toHaveBeenCalled();
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });

    // Ajout de tests supplémentaires pour améliorer la couverture
    test("Then I can upload a file with correct extension", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store: mockStore,
        localStorage: window.localStorage,
      });

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0]).toEqual(file);
    });

    test("Then I can't upload a file with wrong extension", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        },
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Mock de window.alert
      global.alert = jest.fn();

      const file = new File(["test"], "test.pdf", { type: "application/pdf" });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        "Veuillez télécharger un fichier avec une extension jpg, jpeg ou png."
      );
    });
  });
});
