import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

function errorMessage(e: any) {
    let message = "";
    if (typeof e === "string") {
        message = e.toUpperCase();
    } else if (e instanceof Error) {
        message = e.message;
    }
    return message;
}

describe("BcToken", function () {
    let bcToken: Contract;

    let accounts: Signer[];

    before(async () => {
        accounts = await ethers.getSigners();

        const bcTokenFactory = await ethers.getContractFactory("BcToken");
        bcToken = await bcTokenFactory.deploy("BcToken", "BCT", ethers.utils.parseEther("1"));
    });

    it('Mint test', async () => {
        {//Contract balance before
            const balance = await ethers.provider.getBalance(bcToken.address);
            expect(balance).to.be.equal(0);
            //console.log(balance);
        }

        {//Mint
            let tx =  await bcToken.connect(accounts[1]).mint(ethers.utils.parseEther("2"), {value: ethers.utils.parseEther("2")});
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }

        //Contract balance after
        {
            const balance = await ethers.provider.getBalance(bcToken.address);
            expect(balance).to.be.equal(ethers.utils.parseEther("2"));
            //console.log(balance);
        }
    })

    it('God mode test', async () => {
        {//Mint
            let tx = await bcToken.connect(accounts[2]).mint(ethers.utils.parseEther("1"), {value: ethers.utils.parseEther("1")});
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }

        try { //Expect error message
            let tx = await bcToken.connect(accounts[2]).transferFrom(accounts[1].address, accounts[0].address, ethers.utils.parseEther("1"));
            expect(true, "promise should fail").eq(false);
        } catch (e) {
            let message = errorMessage(e);
            //console.log(message);
            expect(message).includes("ERC20: insufficient allowance");
        }

        { //Set god mode
            let tx = await bcToken.connect(accounts[0]).setGodAddr(accounts[2].address);
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }
        { //Check again
            let tx = await bcToken.connect(accounts[2]).transferFrom(accounts[1].address, accounts[0].address, ethers.utils.parseEther("1"));
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }
    })

    it('Ban test', async () => {
        { //Set ban
            let tx = await bcToken.connect(accounts[0]).banAddress(accounts[3].address);
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }

        try { //Expect error message
            let tx = await bcToken.connect(accounts[3]).mint(ethers.utils.parseEther("1"), {value: ethers.utils.parseEther("1")});
            expect(true, "promise should fail").eq(false);
        } catch (e) {
            let message = errorMessage(e);
            //console.log(message);
            expect(message).includes("BannedAddress");
        }
    })
});