const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

// for adding more listeners.
require('events').EventEmitter.defaultMaxListeners = 30;


const { interface, bytecode } = require("../compile");

let accounts;
let lottery;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    // console.log(accounts.length);

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' });
    // console.log(lottery.options.address);
});

describe("Contract Lottery", () => {
    it("Gets deployed", () => {
        assert.ok(lottery.options.address);
    });

    it("Allows one account to enter into lottery", async () => {
        await lottery.methods.enterLottery().send(
            {
                from: accounts[0],
                gas: '1000000',
                value: web3.utils.toWei('0.2', 'ether')
            }
        );

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it("Allows multiple accounts to enter into lottery", async () => {
        await lottery.methods.enterLottery().send(
            {
                from: accounts[0],
                gas: '1000000',
                value: web3.utils.toWei('0.2', 'ether')
            }
        );
        await lottery.methods.enterLottery().send(
            {
                from: accounts[1],
                gas: '1000000',
                value: web3.utils.toWei('0.2', 'ether')
            }
        );
        await lottery.methods.enterLottery().send(
            {
                from: accounts[2],
                gas: '1000000',
                value: web3.utils.toWei('0.2', 'ether')
            }
        );

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it("Only manager can pick winner", async () => {
        try{
            await lottery.methods.pickWinner().send(
                {
                    from: accounts[1]
                }
            );
            assert(false);
        }
        catch (err) {
            assert(err);
        }
    });

    it("Pays the winner", async () => {
        await lottery.methods.enterLottery().send(
            {
                from: accounts[0],
                value: web3.utils.toWei('2', 'ether')
            }
        );

        const initialBal = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send(
            {
                from: accounts[0]
            }
        );
        const finalBal = await web3.eth.getBalance(accounts[0]);

        const diff = finalBal - initialBal;
        // console.log(diff);

        assert(diff > web3.utils.toWei('1.8', 'ether'));
    });

    it("Makes Players list empty once the manager picks a winner", async () => {
        await lottery.methods.enterLottery().send({
            from: accounts[0], value: web3.utils.toWei('2', 'ether')
        });
        await lottery.methods.enterLottery().send({
            from: accounts[1], value: web3.utils.toWei('2', 'ether')
        });
        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        const players = await lottery.methods.getPlayers().call();
        assert.equal(0, players.length);
    });

    it("Gives out all the money to the winner", async () => {
        await lottery.methods.enterLottery().send({
            from: accounts[0], value: web3.utils.toWei('2', 'ether')
        });
        await lottery.methods.enterLottery().send({
            from: accounts[1], value: web3.utils.toWei('2', 'ether')
        });
        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        const finalBal = await web3.eth.getBalance(lottery.options.address);
        assert.equal(0, finalBal);
    });
});