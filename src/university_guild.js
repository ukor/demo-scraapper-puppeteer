const fs = require("fs");
const puppeteer = require("puppeteer");

function getTotalNumberOfPages() {
  const pagenationWrapper = document.querySelector("ul.pagn");
  const pagenationLinkElements = pagenationWrapper.querySelectorAll(
    "li.pglt > a.pg_lnk"
  );
  const pagenationLinks = Array.from(pagenationLinkElements);
  // the content of the elemnt before the last
  // represent the total number of pages
  const numberOfPages = pagenationLinks[
    pagenationLinks.length - 2
  ].textContent.trim();
  return Number(numberOfPages);
}

function getUniversities() {
  const url = "https://www.thecompleteuniversityguide.co.uk";
  const universityLinkElements = document.querySelectorAll(
    "div.uni_lft > h3 > a"
  );
  const universitiesLinks = Array.from(universityLinkElements);
  const universities = universitiesLinks
    .map((aTag) => {
      const universityName = aTag.textContent.trim();
      if (universityName === "") {
        return null;
      }
      return {
        name: universityName,
        profileURL: `${url}${aTag.getAttribute("href")}`,
        universityName: aTag.getAttribute("data-university-name"),
      };
    })
    .filter((university) => university !== null);

  return universities;
}

(async () => {
  try {
    const url = "https://www.thecompleteuniversityguide.co.uk";
    const university_url = `${url}/universities`;
    // opent the browser and start a new page
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(university_url);

    const totalNumberOfPages = await page.evaluate(getTotalNumberOfPages);
    const universities = await page.evaluate(getUniversities);
    // pagenation link structure =
    // https://www.thecompleteuniversityguide.co.uk/universities?pg=2
    for (let pageNumber = 2; pageNumber <= totalNumberOfPages; pageNumber++) {
      await page.goto(`${university_url}?pg=${pageNumber}`, {
        waitUntil: "networkidle0",
      });
      const unis = await page.evaluate(getUniversities);
      universities.push(...unis);
      //   pause for 5 seconds
      //   await page.waitForTimeout(5000)
    }
    console.log(totalNumberOfPages, "pagenation", universities);
    await fs.writeFile(
      "universities.json",
      JSON.stringify(universities),
      () => {}
    );
    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
