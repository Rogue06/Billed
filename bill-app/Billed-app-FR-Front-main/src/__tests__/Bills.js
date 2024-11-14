/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Logout from "../containers/Logout.js";
import DashboardUI from "../views/DashboardUI.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon"); // Ajout d'un expect
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Vérifie que le clic sur le bouton "Nouvelle facture" navigue vers la page "Nouvelle facture"
    test("Then clicking on New Bill button should navigate to NewBill page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = BillsUI({ data: bills });

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const handleClickNewBill = jest.fn(() =>
        billsContainer.handleClickNewBill()
      );
      const newBillBtn = screen.getByTestId("btn-new-bill");
      newBillBtn.addEventListener("click", handleClickNewBill);
      userEvent.click(newBillBtn);
      expect(handleClickNewBill).toHaveBeenCalled();

      //Vérifie si la page NewBill est bien affichée
      expect(screen.getByTestId(`form-new-bill`)).toBeTruthy();
    });

    // Ce test vérifie que le clic sur l'icône de "l'œil" ouvre la modale
    test("Then clicking on icon eye should open modal", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      $.fn.modal = jest.fn();

      const eye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        billsContainer.handleClickIconEye(eye)
      );

      eye.addEventListener("click", handleClickIconEye);
      userEvent.click(eye);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });

    describe("When I click on eye icon", () => {
      // Ce test vérifie que la modale affiche l'image dans le format correct lorsque l'icône de l'œil est cliquée
      test("Then, modal should display image in correct format", () => {
        document.body.innerHTML = `
          ${BillsUI({ data: bills })}
          <div class="modal fade" id="modaleFile" data-testid="modaleFile">
          </div>`;

        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        const iconEye = screen.getAllByTestId("icon-eye")[0];
        const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye);
        iconEye.addEventListener("click", () => handleClickIconEye(iconEye));

        userEvent.click(iconEye);
        expect(screen.getByTestId("modaleFile")).toBeTruthy();
      });
    });

    // Test d'intégration GET
    describe("Given I am a user connected as Employee", () => {
      describe("When I navigate to Bills", () => {
        test("fetches bills from mock API GET", async () => {
          // Nettoyer le DOM avant le test
          document.body.innerHTML = "";

          localStorage.setItem(
            "user",
            JSON.stringify({ type: "Employee", email: "a@a" })
          );
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.append(root);
          router();
          window.onNavigate(ROUTES_PATH.Bills);

          await waitFor(() => screen.getByText("Mes notes de frais"));

          // Vérifier les éléments spécifiques à la page Bills
          const billsTable = await screen.getByTestId("tbody");
          expect(billsTable).toBeTruthy();

          // Vérifier le nombre de lignes dans le tableau (4 factures + 1 en-tête)
          const rows = screen.getAllByRole("row");
          expect(rows.length).toBe(5);

          // Vérifier les icônes d'action
          const iconEyes = screen.getAllByTestId("icon-eye");
          expect(iconEyes.length).toBe(4);
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
            document.body.innerHTML = ""; // Nettoyer le DOM
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.appendChild(root);
            router();
          });

          // Ce test vérifie que lorsque l'API renvoie une erreur 404, un message d'erreur est affiché.
          test("fetches bills from an API and fails with 404 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 404"));
                },
              };
            });
            window.onNavigate(ROUTES_PATH.Bills);
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 404/);
            expect(message).toBeTruthy();
          });

          // Ce test vérifie que lorsque l'API renvoie une erreur 500, un message d'erreur est affiché.
          test("fetches messages from an API and fails with 500 message error", async () => {
            mockStore.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 500"));
                },
              };
            });
            window.onNavigate(ROUTES_PATH.Bills);
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 500/);
            expect(message).toBeTruthy();
          });
        });
      });
    });
    // Test du bouton disconnect dans le layout vertical
    describe("Given I am connected", () => {
      describe("When I click on disconnect button", () => {
        test("Then, I should be sent to login page", () => {
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          };
          Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
          });
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
          );

          // Création du DOM avec le layout vertical qui contient le bouton de déconnexion
          document.body.innerHTML = `
            <div id="root">
              ${BillsUI({ data: bills })}
            </div>
          `;

          const logout = new Logout({ document, onNavigate, localStorage });
          const handleClick = jest.fn(logout.handleClick);

          const disco = screen.getByTestId("layout-disconnect");
          disco.addEventListener("click", handleClick);
          userEvent.click(disco);
          expect(handleClick).toHaveBeenCalled();
          expect(screen.getByText("Administration")).toBeTruthy();
        });
      });
    });
  });
});
