const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs").promises;

function flattenJSON(obj = {}, res = {}, extraKey = "") {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] !== "object") {
      res[extraKey + key] = obj[key];
    } else {
      flattenJSON(obj[key], res, `${extraKey}${key}.`);
    }
  });
  return res;
}

// most @actions toolkit packages have async methods
async function run() {
  try {
    const fileName = core.getInput("file");
    console.log(`Check duplicate i18n keys in file ${fileName}`);
    const content = await fs.readFile(fileName, {
      encoding: "utf-8",
    });
    const flatten = flattenJSON(JSON.parse(content));
    const obj2 = {};
    const keys = Object.keys(flatten);
    core.info("Keys ", keys);
    for (const element of keys) {
      const k = element;
      const v = flatten[k];
      if (!obj2[v]) {
        obj2[v] = [k];
      } else {
        obj2[v].push(k);
      }
    }

    core.info("Ob2 ", obj2);

    const duplicatedKeys = [];
    const keys2 = Object.keys(obj2);
    for (const element of keys2) {
      const k = element;
      const v = obj2[k];
      if (v.length > 1) {
        duplicatedKeys.push("- " + v.join(", "));
      }
    }
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);

    const [owner, repo] = core.getInput("repository").split("/");

    if (duplicatedKeys.length > 0) {
      const sb = [];
      sb.push("❌ PR contains duplicated i18n keys");
      sb.push("```");
      sb.push(duplicatedKeys.join("\n"));
      sb.push("```");
      octokit.rest.issues.createComment({
        body: sb.join("\n"),
        repo,
        owner,
        issue_number: Number(core.getInput("issue-number")),
      });
      core.setFailed("PR contains duplicated i18n keys");
    } else {
      console.log("Done! No duplicated i18n strings");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
