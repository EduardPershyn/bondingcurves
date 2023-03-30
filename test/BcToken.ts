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
        //bcToken = await bcTokenFactory.deploy("BcToken", "BCT", 0);
    });

    it('Mint test', async () => {
        {//Contract balance before
            const balance = await ethers.provider.getBalance(bcToken.address);
            expect(balance).to.be.equal(0);
            //console.log(balance);
        }

//         {
//             let amountWei = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("2"));
//             console.log(amountWei);
//             let amountStr = ethers.utils.formatEther(amountWei);
//             let amount = parseInt(amountStr, 10);
//             console.log(amount);
//         }


        {//Mint
            let priceWei = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("2"));
            console.log(priceWei);
            let tx =  await bcToken.connect(accounts[1]).mint(ethers.utils.parseEther("2"), {value: priceWei});
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }

//         {
//             let amountWei = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("2"));
//             console.log(amountWei);
//             let amountStr = ethers.utils.formatEther(amountWei);
//             let amount = parseInt(amountStr, 10);
//             console.log(amount);
//         }


        //Contract balance after
        {
            const balance = await ethers.provider.getBalance(bcToken.address);
            expect(balance).to.be.equal(ethers.utils.parseEther("4"));
            //console.log(balance);
        }
    })

    it('God mode test', async () => {
        {//Mint
            let priceWei = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("1"));
            //console.log(priceWei);
            let tx = await bcToken.connect(accounts[2]).mint(ethers.utils.parseEther("1"), {value: priceWei});
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
            let priceWei = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("1"));
            //console.log(priceWei);
            let tx = await bcToken.connect(accounts[3]).mint(ethers.utils.parseEther("1"), {value: priceWei});
            expect(true, "promise should fail").eq(false);
        } catch (e) {
            let message = errorMessage(e);
            //console.log(message);
            expect(message).includes("BannedAddress");
        }

        { //increaseAllowance
            let tx = await bcToken.connect(accounts[0]).increaseAllowance(accounts[3].address, ethers.utils.parseEther("1"));
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }
        try { //Expect error message
            let tx = await bcToken.connect(accounts[3]).transferFrom(accounts[0].address, accounts[3].address, ethers.utils.parseEther("1"));
            expect(true, "promise should fail").eq(false);
        } catch (e) {
            let message = errorMessage(e);
            //console.log(message);
            expect(message).includes("BannedAddress");
        }

//         { //Check again
//             let tx = await bcToken.connect(accounts[3]).transferFrom(accounts[0].address, accounts[3].address, ethers.utils.parseEther("1"));
//             let receipt = await tx.wait();
//             expect(receipt.status).to.be.equal(1);
//         }

//         { //Hardhat way of calling overloaded functions
//             let tx = await bcToken.connect(accounts[3])["transferFromAndCall(address,address,uint256)"](accounts[0].address, accounts[3].address, ethers.utils.parseEther("1"));
//             let receipt = await tx.wait();
//             expect(receipt.status).to.be.equal(1);
//         }


    })

    it('Burn test', async () => {
        {//Price before
            let price = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("1"));
            expect(price).to.be.equal(ethers.utils.parseEther("4.5"));
        }
        {//Burn
            let tx = await bcToken.connect(accounts[1]).burn(ethers.utils.parseEther("1"));
            let receipt = await tx.wait();
            expect(receipt.status).to.be.equal(1);
        }
        {//Price after
            let price = await bcToken.connect(accounts[1]).getPriceForAmount(ethers.utils.parseEther("1"));
            expect(price).to.be.equal(ethers.utils.parseEther("3.5"));
        }
    })
});