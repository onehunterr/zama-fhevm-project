import { Counter, Counter__factory } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory(
    "Counter"
  )) as Counter__factory;

  const counterContract = (await factory.deploy()) as Counter;
  const counterContractAddress = await counterContract.getAddress(); // ← string, **not** Counter

  return { counterContract, counterContractAddress };
}

describe("Counter", function () {
  let signers: Signers;
  let counterContract: Counter;
  let counterContractAddress: string; // ← string, not Counter

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
    };
  });

  beforeEach(async () => {
    ({ counterContract, counterContractAddress } = await deployFixture());
  });

it("decrement the counter by 1", async function () {
  // First increment, count becomes 1
  let tx = await counterContract.connect(signers.alice).increment(1);
  await tx.wait();
  // Then decrement, count goes back to 0
  tx = await counterContract.connect(signers.alice).decrement(1);
  await tx.wait();
  const count = await counterContract.getCount();
  expect(count).to.eq(0);
});
});
